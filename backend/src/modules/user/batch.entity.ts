import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';

@Entity('batches')
export class Batch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  courseId: string;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => User, (user) => user.batch)
  students: User[];

  @ManyToMany(() => User, (user) => user.assignedBatches)
  @JoinTable({
    name: 'faculty_batches',
    joinColumn: { name: 'batchId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'facultyId', referencedColumnName: 'id' },
  })
  assignedFaculty: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
