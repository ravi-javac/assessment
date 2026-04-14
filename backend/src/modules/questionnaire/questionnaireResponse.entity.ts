import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';

@Entity('questionnaire_responses')
@Index(['testId', 'studentId'])
export class QuestionnaireResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  testId: string;

  @Column()
  studentId: string;

  @Column()
  questionnaireId: string;

  @Column()
  fieldId: string;

  @Column({ type: 'text', nullable: true })
  responseText: string;

  @Column({ type: 'int', nullable: true })
  responseNumber: number;

  @CreateDateColumn()
  createdAt: Date;
}