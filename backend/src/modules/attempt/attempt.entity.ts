import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Test } from '../assessment/assessment.entity';

export enum AttemptStatus {
  STARTED = 'started',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  AUTO_SUBMITTED = 'auto_submitted',
  EVALUATED = 'evaluated',
}

@Entity('attempts')
export class Attempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  testId: string;

  @ManyToOne(() => Test, { nullable: true })
  @JoinColumn({ name: 'testId' })
  test: Test;

  @Column({
    type: 'enum',
    enum: AttemptStatus,
    default: AttemptStatus.STARTED,
  })
  status: AttemptStatus;

  @Column({ type: 'int', default: 0 })
  totalMarks: number;

  @Column({ type: 'int', default: 0 })
  obtainedMarks: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  percentage: number;

  @Column({ default: false })
  isPassed: boolean;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  submittedAt: Date;

  @Column({ type: 'int', default: 0 })
  timeTaken: number;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  deviceInfo: string;

  @Column({ nullable: true })
  browserInfo: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('answers')
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  attemptId: string;

  @ManyToOne(() => Attempt, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'attemptId' })
  attempt: Attempt;

  @Column({ nullable: true })
  questionId: string;

  @Column({ nullable: true })
  sectionId: string;

  @Column({ nullable: true })
  userAnswer: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  marksObtained: number;

  @Column({ default: false })
  isCorrect: boolean;

  @Column({ nullable: true })
  feedback: string;

  @Column({ nullable: true })
  codeOutput: string;

  @Column({ default: false })
  isAutoSaved: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}