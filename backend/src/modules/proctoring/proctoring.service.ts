import { Repository, getRepository } from 'typeorm';
import { Attempt } from '../attempt/attempt.entity';
import { 
  ProctoringEvent, ProctoringEventType, 
  ProctoringSnapshot, SuspicionScore 
} from './proctoring.entity';

export interface TabEventDto {
  attemptId: string;
  type: 'blur' | 'focus' | 'visibilitychange';
  timestamp: Date;
}

export interface FaceDetectionDto {
  attemptId: string;
  faceCount: number;
  timestamp: Date;
}

export interface MovementDto {
  attemptId: string;
  movementLevel: number;
  timestamp: Date;
}

export interface ScreenshotDto {
  attemptId: string;
  imageData: string;
  timestamp: Date;
}

export class ProctoringService {
  constructor(
    private proctoringEventRepository: Repository<ProctoringEvent>,
    private snapshotRepository: Repository<ProctoringSnapshot>,
    private suspicionScoreRepository: Repository<SuspicionScore>
  ) {}

  async handleTabEvent(dto: TabEventDto): Promise<ProctoringEvent> {
    let type: ProctoringEventType;
    let details = '';

    if (dto.type === 'blur' || dto.type === 'visibilitychange') {
      type = ProctoringEventType.TAB_SWITCH;
      details = `Tab lost focus at ${dto.timestamp.toISOString()}`;
    } else {
      type = ProctoringEventType.TAB_SWITCH;
      details = `Tab regained focus at ${dto.timestamp.toISOString()}`;
    }

    const event = this.proctoringEventRepository.create({
      attemptId: dto.attemptId,
      type,
      details,
      severity: type === ProctoringEventType.TAB_SWITCH ? 2 : 1,
    });

    return this.proctoringEventRepository.save(event);
  }

  async handleFaceDetection(dto: FaceDetectionDto): Promise<ProctoringEvent> {
    let type: ProctoringEventType;
    let details = '';
    let severity = 1;

    if (dto.faceCount === 0) {
      type = ProctoringEventType.NO_FACE;
      details = `No face detected at ${dto.timestamp.toISOString()}`;
      severity = 3;
    } else if (dto.faceCount > 1) {
      type = ProctoringEventType.MULTIPLE_FACES;
      details = `${dto.faceCount} faces detected at ${dto.timestamp.toISOString()}`;
      severity = 3;
    } else {
      type = ProctoringEventType.NO_FACE;
      details = `Face not clearly visible at ${dto.timestamp.toISOString()}`;
      severity = 2;
    }

    const event = this.proctoringEventRepository.create({
      attemptId: dto.attemptId,
      type,
      details,
      severity,
    });

    return this.proctoringEventRepository.save(event);
  }

  async handleMovement(dto: MovementDto): Promise<ProctoringEvent> {
    const threshold = 5;
    let type: ProctoringEventType;
    let details = '';
    let severity = 1;

    if (dto.movementLevel > threshold) {
      type = ProctoringEventType.MOVEMENT_EXCESSIVE;
      details = `Excessive movement detected (level: ${dto.movementLevel}) at ${dto.timestamp.toISOString()}`;
      severity = dto.movementLevel > 8 ? 3 : 2;
    } else {
      type = ProctoringEventType.MOVEMENT_EXCESSIVE;
      details = `Normal movement (level: ${dto.movementLevel}) at ${dto.timestamp.toISOString()}`;
      severity = 1;
    }

    const event = this.proctoringEventRepository.create({
      attemptId: dto.attemptId,
      type,
      details,
      severity,
    });

    return this.proctoringEventRepository.save(event);
  }

  async saveScreenshot(dto: ScreenshotDto): Promise<ProctoringSnapshot> {
    const snapshot = this.snapshotRepository.create({
      attemptId: dto.attemptId,
      imageData: dto.imageData,
      faceCount: 1,
      movementDetected: false,
    });

    return this.snapshotRepository.save(snapshot);
  }

  async getEventsByAttempt(attemptId: string): Promise<ProctoringEvent[]> {
    return this.proctoringEventRepository.find({
      where: { attemptId },
      order: { createdAt: 'DESC' },
    });
  }

  async getSnapshotsByAttempt(attemptId: string): Promise<ProctoringSnapshot[]> {
    return this.snapshotRepository.find({
      where: { attemptId },
      order: { createdAt: 'DESC' },
    });
  }

  async calculateSuspicionScore(attemptId: string): Promise<SuspicionScore> {
    const events = await this.getEventsByAttempt(attemptId);
    const snapshots = await this.getSnapshotsByAttempt(attemptId);

    let tabSwitchScore = 0;
    let faceDetectionScore = 0;
    let movementScore = 0;

    events.forEach((event) => {
      switch (event.type) {
        case ProctoringEventType.TAB_SWITCH:
          tabSwitchScore += event.severity;
          break;
        case ProctoringEventType.NO_FACE:
        case ProctoringEventType.MULTIPLE_FACES:
        case ProctoringEventType.FACE_NOT_VISIBLE:
          faceDetectionScore += event.severity;
          break;
        case ProctoringEventType.MOVEMENT_EXCESSIVE:
          movementScore += event.severity;
          break;
      }
    });

    // Normalize scores (0-100 scale)
    tabSwitchScore = Math.min(tabSwitchScore * 10, 100);
    faceDetectionScore = Math.min(faceDetectionScore * 15, 100);
    movementScore = Math.min(movementScore * 8, 100);

    const totalScore = (tabSwitchScore + faceDetectionScore + movementScore) / 3;

    const existingScore = await this.suspicionScoreRepository.findOne({
      where: { attemptId },
    });

    if (existingScore) {
      existingScore.tabSwitchScore = tabSwitchScore;
      existingScore.faceDetectionScore = faceDetectionScore;
      existingScore.movementScore = movementScore;
      existingScore.totalScore = totalScore;
      existingScore.lastCalculated = new Date();

      return this.suspicionScoreRepository.save(existingScore);
    } else {
      const score = this.suspicionScoreRepository.create({
        attemptId,
        tabSwitchScore,
        faceDetectionScore,
        movementScore,
        totalScore,
        lastCalculated: new Date(),
      });

      return this.suspicionScoreRepository.save(score);
    }
  }

  async getSuspicionScore(attemptId: string): Promise<SuspicionScore | null> {
    return this.suspicionScoreRepository.findOne({
      where: { attemptId },
    });
  }
}