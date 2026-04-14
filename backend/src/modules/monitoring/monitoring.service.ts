import { Repository, getRepository } from 'typeorm';
import { ExamSession, LiveExamActivity, ExamAnnouncement } from './monitoring.entity';
import { Attempt, AttemptStatus } from '../attempt/attempt.entity';
import { Test, TestStatus } from '../assessment/assessment.entity';

export class MonitoringService {
  private attemptRepository: Repository<Attempt>;
  private testRepository: Repository<Test>;

  constructor(
    private sessionRepository: Repository<ExamSession>,
    private activityRepository: Repository<LiveExamActivity>,
    private announcementRepository: Repository<ExamAnnouncement>
  ) {
    this.attemptRepository = getRepository(Attempt);
    this.testRepository = getRepository(Test);
  }

  async createSession(testId: string, settings?: any): Promise<ExamSession> {
    const session = this.sessionRepository.create({
      testId,
      status: 'scheduled',
      settings,
    });
    return this.sessionRepository.save(session);
  }

  async getSession(sessionId: string): Promise<ExamSession | null> {
    return this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['test'],
    });
  }

  async getSessionsByTest(testId: string): Promise<ExamSession[]> {
    return this.sessionRepository.find({
      where: { testId },
      order: { createdAt: 'DESC' },
    });
  }

  async startSession(sessionId: string): Promise<ExamSession | null> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.status = 'live';
      session.startedAt = new Date();
      await this.sessionRepository.save(session);
      
      if (session.testId) {
        await this.testRepository.update(session.testId, { status: TestStatus.LIVE });
      }
    }
    return session;
  }

  async pauseSession(sessionId: string): Promise<ExamSession | null> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.status = 'paused';
      await this.sessionRepository.save(session);
    }
    return session;
  }

  async resumeSession(sessionId: string): Promise<ExamSession | null> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.status = 'live';
      await this.sessionRepository.save(session);
    }
    return session;
  }

  async endSession(sessionId: string): Promise<ExamSession | null> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.status = 'completed';
      session.endedAt = new Date();
      await this.sessionRepository.save(session);
    }
    return session;
  }

  async recordActivity(
    sessionId: string,
    attemptId: string,
    activityType: string,
    details?: any
  ): Promise<LiveExamActivity> {
    const activity = this.activityRepository.create({
      examSessionId: sessionId,
      attemptId,
      activityType: activityType as any,
      details,
    });
    return this.activityRepository.save(activity);
  }

  async getRecentActivities(sessionId: string, limit: number = 50): Promise<LiveExamActivity[]> {
    return this.activityRepository.find({
      where: { examSessionId: sessionId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async createAnnouncement(
    sessionId: string,
    title: string,
    message: string,
    isGlobal: boolean = false
  ): Promise<ExamAnnouncement> {
    const announcement = this.announcementRepository.create({
      examSessionId: sessionId,
      title,
      message,
      isGlobal,
    });
    return this.announcementRepository.save(announcement);
  }

  async getAnnouncements(sessionId: string): Promise<ExamAnnouncement[]> {
    return this.announcementRepository.find({
      where: { examSessionId: sessionId },
      order: { createdAt: 'DESC' },
    });
  }

  async forceSubmitAttempt(attemptId: string): Promise<Attempt | null> {
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId },
    });
    
    if (attempt) {
      attempt.status = AttemptStatus.SUBMITTED;
      attempt.submittedAt = new Date();
      await this.attemptRepository.save(attempt);
    }
    
    return attempt;
  }

  async sendWarning(attemptId: string, message: string): Promise<void> {
    await this.recordActivity(null, attemptId, 'warning', { message });
  }

  async extendTime(attemptId: string, minutes: number): Promise<void> {
    await this.recordActivity(null, attemptId, 'extend_time', { minutes });
  }

  async getSessionStats(sessionId: string): Promise<any> {
    const activities = await this.activityRepository.find({
      where: { examSessionId: sessionId },
    });
    
    const stats = {
      started: 0,
      submitted: 0,
      violations: 0,
      warnings: 0,
    };
    
    for (const activity of activities) {
      if (activity.activityType === 'start') stats.started++;
      if (activity.activityType === 'submit') stats.submitted++;
      if (activity.activityType === 'violation') stats.violations++;
      if (activity.activityType === 'warning') stats.warnings++;
    }
    
    return stats;
  }

  async getAllActiveSessions(): Promise<ExamSession[]> {
    return this.sessionRepository.find({
      where: { status: 'live' as any },
      order: { startedAt: 'DESC' },
    });
  }

  async updateSessionStatus(sessionId: string, status: string): Promise<ExamSession | null> {
    await this.sessionRepository.update(sessionId, { status: status as any });
    return this.getSession(sessionId);
  }
}