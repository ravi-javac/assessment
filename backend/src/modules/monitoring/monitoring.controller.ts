import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { ExamSession, LiveExamActivity, ExamAnnouncement } from './monitoring.entity';
import { MonitoringService } from './monitoring.service';

const sessionRepository = getRepository(ExamSession);
const activityRepository = getRepository(LiveExamActivity);
const announcementRepository = getRepository(ExamAnnouncement);

const monitoringService = new MonitoringService(
  sessionRepository,
  activityRepository,
  announcementRepository
);

export class MonitoringController {
  async createSession(req: Request, res: Response): Promise<void> {
    try {
      const { testId, settings } = req.body;
      const session = await monitoringService.createSession(testId, settings);

      res.status(201).json({
        success: true,
        message: 'Exam session created',
        data: session,
      });
    } catch (error) {
      console.error('Create session error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getSession(req: Request, res: Response): Promise<void> {
    try {
      const session = await monitoringService.getSession(req.params.sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          message: 'Session not found',
        });
        return;
      }

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      console.error('Get session error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async startSession(req: Request, res: Response): Promise<void> {
    try {
      const session = await monitoringService.startSession(req.params.sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          message: 'Session not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Session started',
        data: session,
      });
    } catch (error) {
      console.error('Start session error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async pauseSession(req: Request, res: Response): Promise<void> {
    try {
      const session = await monitoringService.pauseSession(req.params.sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          message: 'Session not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Session paused',
        data: session,
      });
    } catch (error) {
      console.error('Pause session error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async resumeSession(req: Request, res: Response): Promise<void> {
    try {
      const session = await monitoringService.resumeSession(req.params.sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          message: 'Session not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Session resumed',
        data: session,
      });
    } catch (error) {
      console.error('Resume session error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async endSession(req: Request, res: Response): Promise<void> {
    try {
      const session = await monitoringService.endSession(req.params.sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          message: 'Session not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Session ended',
        data: session,
      });
    } catch (error) {
      console.error('End session error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getActivities(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;
      const activities = await monitoringService.getRecentActivities(
        req.params.sessionId,
        parseInt(limit as string) || 50
      );

      res.json({
        success: true,
        data: activities,
      });
    } catch (error) {
      console.error('Get activities error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getSessionStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await monitoringService.getSessionStats(req.params.sessionId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async sendWarning(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId, message } = req.body;
      await monitoringService.sendWarning(attemptId, message);

      res.json({
        success: true,
        message: 'Warning sent',
      });
    } catch (error) {
      console.error('Send warning error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async forceSubmit(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const attempt = await monitoringService.forceSubmitAttempt(attemptId);

      if (!attempt) {
        res.status(404).json({
          success: false,
          message: 'Attempt not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Attempt force submitted',
        data: attempt,
      });
    } catch (error) {
      console.error('Force submit error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async extendTime(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId, minutes } = req.body;
      await monitoringService.extendTime(attemptId, minutes);

      res.json({
        success: true,
        message: `Time extended by ${minutes} minutes`,
      });
    } catch (error) {
      console.error('Extend time error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getActiveSessions(req: Request, res: Response): Promise<void> {
    try {
      const sessions = await monitoringService.getAllActiveSessions();

      res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      console.error('Get active sessions error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async createAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, title, message, isGlobal } = req.body;
      const announcement = await monitoringService.createAnnouncement(
        sessionId,
        title,
        message,
        isGlobal
      );

      res.status(201).json({
        success: true,
        message: 'Announcement created',
        data: announcement,
      });
    } catch (error) {
      console.error('Create announcement error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getAnnouncements(req: Request, res: Response): Promise<void> {
    try {
      const announcements = await monitoringService.getAnnouncements(req.params.sessionId);

      res.json({
        success: true,
        data: announcements,
      });
    } catch (error) {
      console.error('Get announcements error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}