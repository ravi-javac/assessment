import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { AttendanceSession, AttendanceRecord } from './attendance.entity';
import { AttendanceService } from './attendance.service';

const sessionRepository = getRepository(AttendanceSession);
const recordRepository = getRepository(AttendanceRecord);

const attendanceService = new AttendanceService(sessionRepository, recordRepository);

export class AttendanceController {
  async createSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const session = await attendanceService.createSession({
        ...req.body,
        createdById: userId,
      });

      res.status(201).json({
        success: true,
        message: 'Attendance session created',
        data: session,
      });
    } catch (error) {
      console.error('Create session error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getSession(req: Request, res: Response): Promise<void> {
    try {
      const session = await attendanceService.getSession(req.params.sessionId);
      if (!session) {
        res.status(404).json({ success: false, message: 'Session not found' });
        return;
      }
      res.json({ success: true, data: session });
    } catch (error) {
      console.error('Get session error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async startSession(req: Request, res: Response): Promise<void> {
    try {
      const session = await attendanceService.startSession(req.params.sessionId);
      if (!session) {
        res.status(404).json({ success: false, message: 'Session not found' });
        return;
      }
      res.json({ success: true, message: 'Session started', data: session });
    } catch (error) {
      console.error('Start session error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async endSession(req: Request, res: Response): Promise<void> {
    try {
      const session = await attendanceService.endSession(req.params.sessionId);
      if (!session) {
        res.status(404).json({ success: false, message: 'Session not found' });
        return;
      }
      res.json({ success: true, message: 'Session ended', data: session });
    } catch (error) {
      console.error('End session error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async generateQRCode(req: Request, res: Response): Promise<void> {
    try {
      const qrCode = await attendanceService.generateQRCode(req.params.sessionId);
      res.json({ success: true, data: { qrCode } });
    } catch (error: any) {
      console.error('Generate QR code error:', error);
      res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
  }

  async markAttendance(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const record = await attendanceService.markAttendance({
        ...req.body,
        userId,
      });

      res.json({ success: true, message: 'Attendance marked', data: record });
    } catch (error: any) {
      console.error('Mark attendance error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async markManual(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { sessionId, targetUserId, status, remarks } = req.body;

      const record = await attendanceService.markManual(
        sessionId,
        targetUserId,
        userId,
        status,
        remarks
      );

      res.json({ success: true, message: 'Attendance marked', data: record });
    } catch (error) {
      console.error('Mark manual error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getSessionRecords(req: Request, res: Response): Promise<void> {
    try {
      const records = await attendanceService.getSessionRecords(req.params.sessionId);
      res.json({ success: true, data: records });
    } catch (error) {
      console.error('Get records error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getSessionReport(req: Request, res: Response): Promise<void> {
    try {
      const report = await attendanceService.getSessionReport(req.params.sessionId);
      res.json({ success: true, data: report });
    } catch (error) {
      console.error('Get report error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getActiveSessions(req: Request, res: Response): Promise<void> {
    try {
      const sessions = await attendanceService.getActiveSessions();
      res.json({ success: true, data: sessions });
    } catch (error) {
      console.error('Get active sessions error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async bulkImportUsers(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, userIds } = req.body;
      const count = await attendanceService.bulkImportUsers(sessionId, userIds);
      res.json({ success: true, message: `${count} users imported` });
    } catch (error) {
      console.error('Bulk import error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}