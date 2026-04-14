import { getRepository } from 'typeorm';
import { Questionnaire } from './questionnaire.entity';
import { QuestionnaireField } from './questionnaireField.entity';
import { QuestionnaireResponse } from './questionnaireResponse.entity';

export class QuestionnaireService {
  private questionnaireRepo = getRepository(Questionnaire);
  private fieldRepo = getRepository(QuestionnaireField);
  private responseRepo = getRepository(QuestionnaireResponse);

  async findAll(filter?: { institutionId?: string }): Promise<Questionnaire[]> {
    const where: any = {};
    if (filter?.institutionId) {
      where.institutionId = filter.institutionId;
    }
    return this.questionnaireRepo.find({
      where,
      relations: ['fields'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Questionnaire | null> {
    return this.questionnaireRepo.findOne({
      where: { id },
      relations: ['fields'],
    });
  }

  async create(data: {
    name: string;
    fields: Array<{
      type: string;
      label: string;
      mandatory: boolean;
      scale?: number;
      options?: string[];
      order: number;
    }>;
    allowComments?: boolean;
    institutionId?: string;
    createdById?: string;
  }): Promise<Questionnaire> {
    const fields = data.fields?.map(f => {
      const field = new QuestionnaireField();
      field.type = f.type as any;
      field.label = f.label;
      field.mandatory = f.mandatory;
      field.scale = f.scale;
      field.options = f.options;
      field.order = f.order;
      return field;
    }) || [];

    const questionnaire = this.questionnaireRepo.create({
      name: data.name,
      fields,
      allowComments: data.allowComments ?? true,
      institutionId: data.institutionId,
      createdById: data.createdById,
    });

    return this.questionnaireRepo.save(questionnaire);
  }

  async update(id: string, data: {
    name?: string;
    fields?: Array<{
      id?: string;
      type: string;
      label: string;
      mandatory: boolean;
      scale?: number;
      options?: string[];
      order: number;
    }>;
    allowComments?: boolean;
  }): Promise<Questionnaire | null> {
    const questionnaire = await this.findById(id);
    if (!questionnaire) return null;

    if (data.name !== undefined) questionnaire.name = data.name;
    if (data.allowComments !== undefined) questionnaire.allowComments = data.allowComments;

    if (data.fields) {
      // Remove existing fields
      await this.fieldRepo.delete({ questionnaireId: id });

      // Add new fields
      questionnaire.fields = data.fields.map(f => {
        const field = new QuestionnaireField();
        field.type = f.type as any;
        field.label = f.label;
        field.mandatory = f.mandatory;
        field.scale = f.scale;
        field.options = f.options;
        field.order = f.order;
        field.questionnaireId = id;
        return field;
      });
    }

    return this.questionnaireRepo.save(questionnaire);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.questionnaireRepo.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async saveResponses(testId: string, studentId: string, questionnaireId: string, responses: Array<{ fieldId: string; response: string | number }>): Promise<void> {
    for (const r of responses) {
      const response = this.responseRepo.create({
        testId,
        studentId,
        questionnaireId,
        fieldId: r.fieldId,
        responseText: typeof r.response === 'string' ? r.response : null,
        responseNumber: typeof r.response === 'number' ? r.response : null,
      });
      await this.responseRepo.save(response);
    }
  }

  async getResponses(testId: string): Promise<QuestionnaireResponse[]> {
    return this.responseRepo.find({
      where: { testId },
      order: { createdAt: 'DESC' },
    });
  }

  async getStudentResponses(testId: string, studentId: string): Promise<QuestionnaireResponse[]> {
    return this.responseRepo.find({
      where: { testId, studentId },
      order: { createdAt: 'DESC' },
    });
  }
}

export const questionnaireService = new QuestionnaireService();