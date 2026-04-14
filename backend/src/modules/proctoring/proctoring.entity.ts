import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Attempt } from '../attempt/attempt.entity';

export enum ProctoringEventType {
  TAB_SWITCH = 'tab_switch',
  TAB_BLUR = 'tab_blur',
  NO_FACE = 'no_face',
  MULTIPLE_FACES = 'multiple_faces',
  FACE_NOT_VISIBLE = 'face_not_visible',
  MOVEMENT_EXCESSIVE = 'movement_excessive',
}

@Entity('proctoring_events')
export class ProctoringEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  attemptId: string;

  @ManyToOne(() => Attempt, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'attemptId' })
  attempt: Attempt;

  @Column({
    type: 'enum',
    enum: ProctoringEventType,
  })
  type: ProctoringEventType;

  @Column({ nullable: true })
  details: string;

  @Column({ type: 'int', default: 1 })
  severity: number;

  @Column({ nullable: true })
  screenshot: string;

  @Column({ nullable: true })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('proctoring_snapshots')
export class ProctoringSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  attemptId: string;

  @ManyToOne(() => Attempt, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'attemptId' })
  attempt: Attempt;

  @Column('text')
  imageData: string;

  @Column({ nullable: true })
  faceCount: number;

  @Column({ nullable: true })
  movementDetected: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('suspicion_scores')
export class SuspicionScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  attemptId: string;

  @ManyToOne(() => Attempt, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'attemptId' })
  attempt: Attempt;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  tabSwitchScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  faceDetectionScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  movementScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  totalScore: number;

  @Column({ nullable: true })
  lastCalculated: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}