import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Questionnaire } from './questionnaire.entity';

export enum QuestionnaireFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  EMAIL = 'email',
  PARAGRAPH = 'paragraph',
  DOB = 'dob',
  RATING = 'rating',
  MCQ = 'mcq',
}

@Entity('questionnaire_fields')
export class QuestionnaireField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: QuestionnaireFieldType })
  type: QuestionnaireFieldType;

  @Column()
  label: string;

  @Column({ default: false })
  mandatory: boolean;

  @Column({ type: 'int', nullable: true })
  scale: number;

  @Column('simple-array', { nullable: true })
  options: string[];

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ nullable: true })
  questionnaireId: string;

  @ManyToOne(() => Questionnaire, questionnaire => questionnaire.fields, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionnaireId' })
  questionnaire: Questionnaire;
}