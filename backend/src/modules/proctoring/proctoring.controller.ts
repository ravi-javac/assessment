import { Request, Response } from 'express';
import { AppDataSource } from '../../config/database';
import { Attempt } from '../attempt/attempt.entity';
import { ProctoringService } from './proctoring.service';
import { ProctoringEvent, ProctoringSnapshot, SuspicionScore } from './proctoring.entity';

const proctoringEventRepository = AppDataSource.getRepository(ProctoringEvent);
const snapshotRepository = AppDataSource.getRepository(ProctoringSnapshot);
const suspicionScoreRepository = AppDataSource.getRepository(SuspicionScore);

const proctoringService = new ProctoringService(
  proctoringEventRepository,
  snapshotRepository,
  suspicionScoreRepository
);

export class ProctoringController {
  async handleTabEvent(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId, type, timestamp } = req.body;

      const event = await proctoringService.handleTabEvent({
        attemptId,
        type,
        timestamp: new Date(timestamp),
      });

      res.json({
        success: true,
        message: 'Tab event recorded',
        data: event,
      });
    } catch (error: any) {
      console.error('Tab event error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async handleFaceDetection(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId, faceCount, timestamp } = req.body;

      const event = await proctoringService.handleFaceDetection({
        attemptId,
        faceCount: Number(faceCount),
        timestamp: new Date(timestamp),
      });

      res.json({
        success: true,
        message: 'Face detection event recorded',
        data: event,
      });
    } catch (error: any) {
      console.error('Face detection error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async handleMovement(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId, movementLevel, timestamp } = req.body;

      const event = await proctoringService.handleMovement({
        attemptId,
        movementLevel: Number(movementLevel),
        timestamp: new Date(timestamp),
      });

      res.json({
        success: true,
        message: 'Movement event recorded',
        data: event,
      });
    } catch (error: any) {
      console.error('Movement error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async saveScreenshot(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId, imageData, timestamp } = req.body;

      const snapshot = await proctoringService.saveScreenshot({
        attemptId,
        imageData,
        timestamp: new Date(timestamp),
      });

      res.json({
        success: true,
        message: 'Screenshot saved',
        data: snapshot,
      });
    } catch (error: any) {
      console.error('Save screenshot error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const events = await proctoringService.getEventsByAttempt(attemptId);

      res.json({
        success: true,
        data: events,
      });
    } catch (error: any) {
      console.error('Get events error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getSnapshots(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const snapshots = await proctoringService.getSnapshotsByAttempt(attemptId);

      res.json({
        success: true,
        data: snapshots,
      });
    } catch (error: any) {
      console.error('Get snapshots error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getSuspicionScore(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const score = await proctoringService.getSuspicionScore(attemptId);

      if (!score) {
        res.status(404).json({
          success: false,
          message: 'Suspicion score not found',
        });
        return;
      }

      res.json({
        success: true,
        data: score,
      });
    } catch (error: any) {
      console.error('Get suspicion score error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async calculateScore(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const score = await proctoringService.calculateSuspicionScore(attemptId);

      res.json({
        success: true,
        message: 'Suspicion score calculated',
        data: score,
      });
    } catch (error: any) {
      console.error('Calculate score error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}