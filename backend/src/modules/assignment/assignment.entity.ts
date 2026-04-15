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

export enum AssignmentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
}

export enum AssignmentType {
  MCQ = 'mcq',
  CODING = 'coding',
  SUBJECTIVE = 'subjective',
  FILE = 'file',
  MIXED = 'mixed',
}

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: AssignmentType,
    default: AssignmentType.MIXED,
  })
  type: AssignmentType;

  @Column({ nullable: true })
  courseId: string;

  @Column({ nullable: true })
  semester: string;

  @Column({ nullable: true })
  batch: string;

  @Column({ nullable: true })
  section: string;

  @Column({ nullable: true })
  institutionId: string;

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.DRAFT,
  })
  status: AssignmentStatus;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ type: 'int', default: 100 })
  totalMarks: number;

  @Column({ default: false })
  allowLateSubmission: boolean;

  @Column({ type: 'int', default: 0 })
  latePenaltyPercent: number;

  @Column({ default: false })
  allowFileUpload: boolean;

  @Column({ default: true })
  allowTextSubmission: boolean;

  @Column({ default: 0 })
  maxFileSizeMB: number;

  @Column('simple-array', { nullable: true })
  allowedFileTypes: string[];

  @Column({ default: 1 })
  maxFiles: number;

  @Column({ type: 'int', default: 1 })
  maxAttempts: number;

  @Column({ default: false })
  isAdminApproved: boolean;

  @Column({ type: 'int', nullable: true })
  durationMinutes: number;

  @Column('simple-json', { nullable: true })
  readingMaterials: { title: string; url: string; type: string }[];

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ default: 0 })
  totalSubmissions: number;

  @Column({ default: 0 })
  gradedSubmissions: number;

  @OneToMany(() => AssignmentQuestion, (aq) => aq.assignment)
  questions: AssignmentQuestion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('assignment_questions')
export class AssignmentQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  assignmentId: string;

  @ManyToOne(() => Assignment, (assignment) => assignment.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignmentId' })
  assignment: Assignment;

  @Column()
  questionId: string;

  @ManyToOne('Question', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question: any; // Using any because Question is in another module

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  marks: number;

  @Column({ type: 'int', default: 0 })
  order: number;
}

@Entity('assignment_submissions')
export class AssignmentSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  assignmentId: string;

  @ManyToOne(() => Assignment, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'assignmentId' })
  assignment: Assignment;

  @Column({ nullable: true })
  studentId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column('text', { nullable: true })
  textContent: string;

  @Column('simple-json', { nullable: true })
  files: { name: string; url: string; size: number }[];

  @Column({ default: false })
  isLate: boolean;

  @Column({ type: 'int', default: 1 })
  attemptNumber: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  marksObtained: number;

  @Column({ nullable: true })
  feedback: string;

  @Column({ nullable: true })
  gradedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'gradedById' })
  gradedBy: User;

  @Column({ nullable: true })
  gradedAt: Date;

  @Column({
    type: 'enum',
    enum: ['submitted', 'graded', 'returned', 'in_progress', 'not_submitted'],
    default: 'submitted',
  })
  status: string;

  @OneToMany(() => AttemptAnswer, (aa) => aa.submission)
  answers: AttemptAnswer[];

  @CreateDateColumn()
  submittedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('assignment_attempt_answers')
export class AttemptAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  submissionId: string;

  @ManyToOne(() => AssignmentSubmission, (submission) => submission.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submissionId' })
  submission: AssignmentSubmission;

  @Column()
  questionId: string;

  @ManyToOne('Question')
  @JoinColumn({ name: 'questionId' })
  question: any;

  @Column('text', { nullable: true })
  answer: string;

  @Column('simple-json', { nullable: true })
  codingAnswer: { code: string; language: string; results?: any };

  @Column('simple-json', { nullable: true })
  mcqAnswer: { selectedOption: string; isCorrect: boolean };

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  marksObtained: number;

  @Column({ nullable: true })
  feedback: string;
}