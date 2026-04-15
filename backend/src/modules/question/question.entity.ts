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

export enum QuestionType {
  MCQ = 'mcq',
  CODING = 'coding',
  SUBJECTIVE = 'subjective',
  SQL = 'sql',
  SUBMISSION = 'submission',
}

export enum QuestionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum QuestionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  title: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: QuestionType,
    default: QuestionType.MCQ,
  })
  type: QuestionType;

  @Column({
    type: 'enum',
    enum: QuestionDifficulty,
    default: QuestionDifficulty.MEDIUM,
  })
  difficulty: QuestionDifficulty;

  @Column({
    type: 'enum',
    enum: QuestionStatus,
    default: QuestionStatus.DRAFT,
  })
  status: QuestionStatus;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column('simple-json', { nullable: true })
  options: { key: string; value: string; isCorrect: boolean }[];

  @Column({ nullable: true })
  correctAnswer: string;

  @Column({ type: 'text', nullable: true })
  correctAnswerExplanation: string;

  @Column({ type: 'text', nullable: true })
  codeTemplate: string;

  @Column({ nullable: true })
  language: string;

  @Column({ nullable: true })
  allowedFileTypes: string; // e.g., ".pdf,.zip,.doc"

  @Column({ type: 'int', nullable: true, default: 10 })
  maxFileSizeMB: number;

  @Column('simple-json', { nullable: true })
  testCases: { input: string; expectedOutput: string; isHidden: boolean }[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  marks: number;

  @Column({ nullable: true })
  institutionId: string;

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ nullable: true })
  referenceUrl: string;

  @Column({ default: 0 })
  attemptCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  successRate: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}