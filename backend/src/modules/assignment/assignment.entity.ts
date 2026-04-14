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

export enum AssignmentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
}

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: true })
  courseId: string;

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

  @Column({ nullable: true })
  instructions: string;

  @Column({ default: 0 })
  totalSubmissions: number;

  @Column({ default: 0 })
  gradedSubmissions: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
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
    enum: ['submitted', 'graded', 'returned'],
    default: 'submitted',
  })
  status: string;

  @CreateDateColumn()
  submittedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}