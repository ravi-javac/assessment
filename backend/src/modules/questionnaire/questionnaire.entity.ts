import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { QuestionnaireField } from './questionnaireField.entity';

@Entity('questionnaires')
export class Questionnaire {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @OneToMany(() => QuestionnaireField, field => field.questionnaire, { cascade: true, eager: true })
  fields: QuestionnaireField[];

  @Column({ default: true })
  allowComments: boolean;

  @Column({ nullable: true })
  institutionId: string;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}