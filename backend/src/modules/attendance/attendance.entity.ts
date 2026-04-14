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
import { Test } from '../assessment/assessment.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

@Entity('attendance_sessions')
export class AttendanceSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  courseId: string;

  @Column({ nullable: true })
  institutionId: string;

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ nullable: true })
  scheduledStart: Date;

  @Column({ nullable: true })
  scheduledEnd: Date;

  @Column({ type: 'int', default: 15 })
  toleranceMinutes: number;

  @Column({ default: false })
  requireQRCode: boolean;

  @Column({ nullable: true })
  qrCodeExpiry: Date;

  @Column({ nullable: true })
  qrCodeSecret: string;

  @Column({ default: false })
  requireGeoLocation: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  geoLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  geoLongitude: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  geoRadius: number;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled',
  })
  status: string;

  @Column({ default: 0 })
  totalExpected: number;

  @Column({ default: 0 })
  totalPresent: number;

  @Column({ default: 0 })
  totalAbsent: number;

  @Column({ default: 0 })
  totalLate: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('attendance_records')
export class AttendanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  sessionId: string;

  @ManyToOne(() => AttendanceSession, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'sessionId' })
  session: AttendanceSession;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.ABSENT,
  })
  status: AttendanceStatus;

  @Column({ nullable: true })
  checkInTime: Date;

  @Column({ nullable: true })
  checkInMethod: string;

  @Column({ nullable: true })
  checkInIP: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  checkInLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  checkInLongitude: number;

  @Column({ nullable: true })
  checkInDevice: string;

  @Column({ nullable: true })
  checkInLocation: string;

  @Column({ default: false })
  isManual: boolean;

  @Column({ nullable: true })
  markedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'markedById' })
  markedBy: User;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;
}