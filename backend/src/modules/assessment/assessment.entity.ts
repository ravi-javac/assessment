import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Question } from '../question/question.entity';

export enum TestStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  LIVE = 'live',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export enum TestVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
}

export enum ProctoringLevel {
  NONE = 'none',
  BASIC = 'basic',
  STRICT = 'strict',
}

@Entity('tests')
export class Test {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TestStatus,
    default: TestStatus.DRAFT,
  })
  status: TestStatus;

  @Column({
    type: 'enum',
    enum: TestVisibility,
    default: TestVisibility.PRIVATE,
  })
  visibility: TestVisibility;

  @Column({ nullable: true })
  accessCode: string;

  @Column({ type: 'int', default: 30 })
  duration: number;

  @Column({ default: false })
  shuffledQuestions: boolean;

  @Column({ default: false })
  shuffledOptions: boolean;

  @Column({ type: 'int', default: 0 })
  passingMarks: number;

  @Column({
    type: 'enum',
    enum: ProctoringLevel,
    default: ProctoringLevel.NONE,
  })
  proctoringLevel: ProctoringLevel;

  @Column({ default: false })
  restrictDevices: boolean;

  @Column({ default: false })
  restrictIP: boolean;

  @Column({ nullable: true })
  allowedIPs: string;

  @Column({ default: true })
  showResults: boolean;

  @Column({ default: true })
  showCorrectAnswers: boolean;

  @Column({ default: true })
  allowPause: boolean;

  @Column({ default: true })
  allowFlag: boolean;

  @Column({ default: false })
  showInstantResults: boolean;

  @Column({ type: 'int', default: 0 })
  breakTime: number;

  @Column({ default: true })
  allowCalculator: boolean;

  @Column({ default: true })
  allowNotes: boolean;

  @Column({ type: 'text', nullable: true })
  resultMessage: string;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ type: 'time', nullable: true })
  scheduledStartTime: string;

  @Column({ type: 'time', nullable: true })
  scheduledEndTime: string;

  @Column({ default: false })
  isQuestionnaire: boolean;

  @Column({ type: 'text', nullable: true })
  questionnaireSettings: string;

  @Column({ nullable: true })
  questionnaireId: string;

  @Column({ nullable: true })
  emailTemplateId: string;

  @Column({ default: true })
  sendResultEmail: boolean;

  @Column({ default: 1 })
  maxAttempts: number;

  @Column({ type: 'int', default: 100 })
  totalMarks: number;

  @Column({ nullable: true })
  institutionId: string;

  @Column({ nullable: true })
  courseId: string;

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('sections')
export class Section {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'int', default: 0 })
  duration: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  marks: number;

  @Column({ default: false })
  shuffledQuestions: boolean;

  @Column({ default: true })
  showResults: boolean;

  @Column({ nullable: true, type: 'int' })
  sectionDuration: number;

  @Column({ nullable: true })
  sectionShowResults: boolean;

  @Column({ nullable: true })
  sectionShuffledQuestions: boolean;

  @Column({ nullable: true })
  sectionAllowPause: boolean;

  @Column({ nullable: true })
  sectionAllowFlag: boolean;

  @Column({ nullable: true })
  sectionShowInstantResults: boolean;

  @Column({ nullable: true, type: 'int' })
  sectionBreakTime: number;

  @Column({ nullable: true })
  sectionAllowCalculator: boolean;

  @Column({ nullable: true })
  sectionAllowNotes: boolean;

  @Column({ nullable: true })
  sectionShowCorrectAnswers: boolean;

  @Column({ nullable: true, type: 'int' })
  sectionQuestionDuration: number;

  @Column({ nullable: true })
  sectionQuestionShowResults: boolean;

  @Column({ nullable: true })
  sectionQuestionShowCorrectAnswers: boolean;

  @Column({ nullable: true })
  sectionQuestionAllowFlag: boolean;

  @Column({ nullable: true, type: 'int' })
  sectionQuestionDefaultMarks: number;

  @Column({ default: false })
  questionPoolEnabled: boolean;

  @Column({ nullable: true, type: 'int' })
  poolSize: number;

  @Column({ default: true })
  poolRandomSelection: boolean;

  @Column({ nullable: true, type: 'int' })
  poolPullMarks: number;

  @Column({ nullable: true, type: 'int' })
  poolPullDuration: number;

  @Column({ type: 'text', nullable: true })
  allowedLanguages: string; // Comma-separated languages for coding questions

  @Column({
    type: 'enum',
    enum: ProctoringLevel,
    default: ProctoringLevel.NONE,
  })
  sectionProctoringLevel: ProctoringLevel;

  @Column({ nullable: true })
  testId: string;

  @ManyToOne(() => Test, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'testId' })
  test: Test;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('subsections')
export class Subsection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'int', default: 0 })
  duration: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  marks: number;

  @Column({ default: false })
  shuffledQuestions: boolean;

  @Column({ default: true })
  showResults: boolean;

  @Column({ default: false })
  randomCutoff: boolean;

  @Column({ type: 'int', default: 0 })
  cutoffMarks: number;

  @Column({ nullable: true, type: 'int' })
  subsectionDuration: number;

  @Column({ nullable: true })
  subsectionShowResults: boolean;

  @Column({ nullable: true })
  subsectionShuffledQuestions: boolean;

  @Column({ nullable: true })
  subsectionAllowPause: boolean;

  @Column({ nullable: true })
  subsectionAllowFlag: boolean;

  @Column({ nullable: true })
  subsectionShowInstantResults: boolean;

  @Column({ nullable: true, type: 'int' })
  subsectionBreakTime: number;

  @Column({ nullable: true })
  subsectionAllowCalculator: boolean;

  @Column({ nullable: true })
  subsectionAllowNotes: boolean;

  @Column({ nullable: true })
  subsectionShowCorrectAnswers: boolean;

  @Column({ nullable: true, type: 'int' })
  subsectionQuestionDuration: number;

  @Column({ nullable: true })
  subsectionQuestionShowResults: boolean;

  @Column({ nullable: true })
  subsectionQuestionShowCorrectAnswers: boolean;

  @Column({ nullable: true })
  subsectionQuestionAllowFlag: boolean;

  @Column({ nullable: true, type: 'int' })
  subsectionQuestionDefaultMarks: number;

  @Column({ default: false })
  questionPoolEnabled: boolean;

  @Column({ nullable: true, type: 'int' })
  poolSize: number;

  @Column({ default: true })
  poolRandomSelection: boolean;

  @Column({ nullable: true, type: 'int' })
  poolPullMarks: number;

  @Column({ nullable: true, type: 'int' })
  poolPullDuration: number;

  @Column({ type: 'text', nullable: true })
  allowedLanguages: string; // Comma-separated languages for coding questions

  @Column({
    type: 'enum',
    enum: ProctoringLevel,
    default: ProctoringLevel.NONE,
  })
  subsectionProctoringLevel: ProctoringLevel;

  @Column({ nullable: true })
  sectionId: string;

  @ManyToOne(() => Section, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sectionId' })
  section: Section;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('test_questions')
export class TestQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  marks: number;

  @Column({ nullable: true })
  questionId: string;

  @Column({ nullable: true })
  sectionId: string;

  @Column({ nullable: true })
  subsectionId: string;

  @ManyToOne(() => Question, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'questionId' })
  question: Question;

  @ManyToOne(() => Section, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'sectionId' })
  section: Section;

  @ManyToOne(() => Subsection, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'subsectionId' })
  subsection: Subsection;

  @Column({ nullable: true })
  testId: string;

  @ManyToOne(() => Test, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'testId' })
  test: Test;

  @Column({ nullable: true, type: 'int' })
  questionDuration: number;

  @Column({ nullable: true })
  questionShowResults: boolean;

  @Column({ nullable: true })
  questionShowCorrectAnswers: boolean;

  @Column({ nullable: true })
  questionAllowFlag: boolean;

  @Column({ nullable: true, type: 'int' })
  questionMarks: number;
}