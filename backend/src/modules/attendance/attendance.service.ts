import { Repository, getRepository } from 'typeorm';
import { AttendanceSession, AttendanceRecord, AttendanceStatus } from './attendance.entity';
import { User } from '../user/user.entity';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

export interface CreateSessionDto {
  title: string;
  courseId?: string;
  institutionId?: string;
  createdById: string;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  toleranceMinutes?: number;
  requireQRCode?: boolean;
  requireGeoLocation?: boolean;
  geoLatitude?: number;
  geoLongitude?: number;
  geoRadius?: number;
}

export interface MarkAttendanceDto {
  sessionId: string;
  userId: string;
  qrCode?: string;
  checkInMethod?: string;
  checkInIP?: string;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkInDevice?: string;
}

export class AttendanceService {
  private userRepository: Repository<User>;

  constructor(
    private sessionRepository: Repository<AttendanceSession>,
    private recordRepository: Repository<AttendanceRecord>
  ) {
    this.userRepository = getRepository(User);
  }

  async createSession(dto: CreateSessionDto): Promise<AttendanceSession> {
    const session = this.sessionRepository.create({
      ...dto,
      status: 'scheduled',
    });

    if (dto.requireQRCode) {
      session.qrCodeSecret = uuidv4();
      session.qrCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes default
    }

    return this.sessionRepository.save(session);
  }

  async getSession(sessionId: string): Promise<AttendanceSession | null> {
    return this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['createdBy'],
    });
  }

  async getSessionsByCourse(courseId: string): Promise<AttendanceSession[]> {
    return this.sessionRepository.find({
      where: { courseId },
      order: { createdAt: 'DESC' },
    });
  }

  async getActiveSessions(): Promise<AttendanceSession[]> {
    return this.sessionRepository.find({
      where: { status: 'active' as any },
      order: { createdAt: 'DESC' },
    });
  }

  async startSession(sessionId: string): Promise<AttendanceSession | null> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.status = 'active';
      if (session.requireQRCode) {
        session.qrCodeSecret = uuidv4();
        session.qrCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);
      }
      await this.sessionRepository.save(session);
    }
    return session;
  }

  async endSession(sessionId: string): Promise<AttendanceSession | null> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.status = 'completed';
      await this.sessionRepository.save(session);
      await this.calculateSessionStats(sessionId);
    }
    return session;
  }

  async cancelSession(sessionId: string): Promise<AttendanceSession | null> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.status = 'cancelled';
      await this.sessionRepository.save(session);
    }
    return session;
  }

  async generateQRCode(sessionId: string): Promise<string> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const qrData = JSON.stringify({
      sessionId: session.id,
      secret: session.qrCodeSecret,
      expiry: session.qrCodeExpiry,
    });

    const qrCode = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
    });

    return qrCode;
  }

  async validateQRCode(sessionId: string, qrCode: string): Promise<boolean> {
    try {
      const qrData = JSON.parse(qrCode);
      const session = await this.getSession(sessionId);

      if (!session) return false;
      if (session.qrCodeSecret !== qrData.secret) return false;
      if (new Date(qrData.expiry) < new Date()) return false;

      return true;
    } catch {
      return false;
    }
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000;
  }

  async markAttendance(dto: MarkAttendanceDto): Promise<AttendanceRecord> {
    const session = await this.getSession(dto.sessionId);
    if (!session) throw new Error('Session not found');

    if (session.requireQRCode && dto.qrCode) {
      const isValid = await this.validateQRCode(dto.sessionId, dto.qrCode);
      if (!isValid) throw new Error('Invalid or expired QR code');
    }

    if (session.requireGeoLocation && dto.checkInLatitude && dto.checkInLongitude) {
      const distance = await this.calculateDistance(
        dto.checkInLatitude,
        dto.checkInLongitude,
        Number(session.geoLatitude),
        Number(session.geoLongitude)
      );

      if (distance > Number(session.geoRadius)) {
        throw new Error('You are outside the allowed location');
      }
    }

    const existing = await this.recordRepository.findOne({
      where: { sessionId: dto.sessionId, userId: dto.userId },
    });

    if (existing) {
      existing.status = AttendanceStatus.PRESENT;
      existing.checkInTime = new Date();
      existing.checkInMethod = dto.checkInMethod || 'qr';
      existing.checkInIP = dto.checkInIP;
      existing.checkInLatitude = dto.checkInLatitude;
      existing.checkInLongitude = dto.checkInLongitude;
      return this.recordRepository.save(existing);
    }

    const scheduledStart = session.scheduledStart || new Date();
    const checkInTime = new Date();
    const lateThreshold = new Date(scheduledStart.getTime() + session.toleranceMinutes * 60 * 1000);

    let status = AttendanceStatus.PRESENT;
    if (checkInTime > lateThreshold) {
      status = AttendanceStatus.LATE;
    }

    const record = this.recordRepository.create({
      sessionId: dto.sessionId,
      userId: dto.userId,
      status,
      checkInTime,
      checkInMethod: dto.checkInMethod || 'qr',
      checkInIP: dto.checkInIP,
      checkInLatitude: dto.checkInLatitude,
      checkInLongitude: dto.checkInLongitude,
      checkInDevice: dto.checkInDevice,
    });

    await this.recordRepository.save(record);
    await this.calculateSessionStats(dto.sessionId);

    return record;
  }

  async markManual(
    sessionId: string,
    userId: string,
    markedById: string,
    status: AttendanceStatus,
    remarks?: string
  ): Promise<AttendanceRecord> {
    const existing = await this.recordRepository.findOne({
      where: { sessionId, userId },
    });

    if (existing) {
      existing.status = status;
      existing.isManual = true;
      existing.markedById = markedById;
      existing.remarks = remarks;
      return this.recordRepository.save(existing);
    }

    const record = this.recordRepository.create({
      sessionId,
      userId,
      status,
      isManual: true,
      markedById,
      remarks,
      checkInTime: new Date(),
    });

    await this.recordRepository.save(record);
    await this.calculateSessionStats(sessionId);

    return record;
  }

  async getRecord(sessionId: string, userId: string): Promise<AttendanceRecord | null> {
    return this.recordRepository.findOne({
      where: { sessionId, userId },
    });
  }

  async getSessionRecords(sessionId: string): Promise<AttendanceRecord[]> {
    return this.recordRepository.find({
      where: { sessionId },
      relations: ['user'],
      order: { checkInTime: 'DESC' },
    });
  }

  async calculateSessionStats(sessionId: string): Promise<void> {
    const records = await this.recordRepository.find({
      where: { sessionId },
    });

    let present = 0;
    let absent = 0;
    let late = 0;

    for (const record of records) {
      if (record.status === AttendanceStatus.PRESENT) present++;
      if (record.status === AttendanceStatus.ABSENT) absent++;
      if (record.status === AttendanceStatus.LATE) late++;
    }

    await this.sessionRepository.update(sessionId, {
      totalPresent: present,
      totalAbsent: absent,
      totalLate: late,
    });
  }

  async getSessionReport(sessionId: string): Promise<any> {
    const session = await this.getSession(sessionId);
    const records = await this.getSessionRecords(sessionId);

    return {
      session,
      summary: {
        total: records.length,
        present: records.filter((r) => r.status === AttendanceStatus.PRESENT).length,
        absent: records.filter((r) => r.status === AttendanceStatus.ABSENT).length,
        late: records.filter((r) => r.status === AttendanceStatus.LATE).length,
        excused: records.filter((r) => r.status === AttendanceStatus.EXCUSED).length,
      },
      records,
    };
  }

  async bulkImportUsers(sessionId: string, userIds: string[]): Promise<number> {
    let imported = 0;

    for (const userId of userIds) {
      const existing = await this.recordRepository.findOne({
        where: { sessionId, userId },
      });

      if (!existing) {
        const record = this.recordRepository.create({
          sessionId,
          userId,
          status: AttendanceStatus.ABSENT,
        });
        await this.recordRepository.save(record);
        imported++;
      }
    }

    await this.calculateSessionStats(sessionId);
    return imported;
  }

  async getStudentHistory(userId: string): Promise<AttendanceRecord[]> {
    return this.recordRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}