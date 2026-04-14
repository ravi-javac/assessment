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
import { Test } from '../assessment/assessment.entity';

@Entity('exam_sessions')
export class ExamSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  testId: string;

  @ManyToOne(() => Test, { nullable: true })
  @JoinColumn({ name: 'testId' })
  test: Test;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  endedAt: Date;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'live', 'paused', 'completed', 'cancelled'],
    default: 'scheduled',
  })
  status: string;

  @Column({ default: 0 })
  totalRegistered: number;

  @Column({ default: 0 })
  totalStarted: number;

  @Column({ default: 0 })
  totalSubmitted: number;

  @Column({ default: 0 })
  totalEvaluated: number;

  @Column('simple-json', { nullable: true })
  settings: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('live_exam_activities')
export class LiveExamActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  attemptId: string;

  @ManyToOne(() => Attempt, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'attemptId' })
  attempt: Attempt;

  @Column({ nullable: true })
  examSessionId: string;

  @ManyToOne(() => ExamSession, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'examSessionId' })
  examSession: ExamSession;

  @Column({ type: 'enum', enum: ['start', 'submit', 'pause_resume', 'violation', 'warning'] })
  activityType: string;

  @Column('simple-json', { nullable: true })
  details: any;

  @CreateDateColumn()
  timestamp: Date;
}

@Entity('exam_announcements')
export class ExamAnnouncement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  examSessionId: string;

  @ManyToOne(() => ExamSession, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'examSessionId' })
  examSession: ExamSession;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ default: false })
  isGlobal: boolean;

  @Column({ default: false })
  isSent: boolean;

  @Column({ nullable: true })
  sentAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}