import { Repository } from 'typeorm';
import { Question, QuestionType, QuestionDifficulty, QuestionStatus } from './question.entity';

export interface CreateQuestionDto {
  title: string;
  content: string;
  type: QuestionType;
  difficulty?: QuestionDifficulty;
  tags?: string[];
  options?: { key: string; value: string; isCorrect: boolean }[];
  correctAnswer?: string;
  correctAnswerExplanation?: string;
  codeTemplate?: string;
  language?: string;
  testCases?: { input: string; expectedOutput: string; isHidden: boolean }[];
  marks?: number;
  institutionId?: string;
  createdById?: string;
}

export interface QuestionFilterDto {
  type?: QuestionType;
  difficulty?: QuestionDifficulty;
  status?: QuestionStatus;
  tags?: string[];
  institutionId?: string;
  createdById?: string;
  search?: string;
}

export class QuestionService {
  constructor(private questionRepository: Repository<Question>) {}

  async create(createDto: CreateQuestionDto): Promise<Question> {
    const question = this.questionRepository.create({
      ...createDto,
      status: QuestionStatus.DRAFT,
      tags: createDto.tags || [],
    });
    return this.questionRepository.save(question);
  }

  async findAll(filter?: QuestionFilterDto): Promise<Question[]> {
    const query = this.questionRepository.createQueryBuilder('question');

    if (filter?.type) {
      query.andWhere('question.type = :type', { type: filter.type });
    }
    if (filter?.difficulty) {
      query.andWhere('question.difficulty = :difficulty', { difficulty: filter.difficulty });
    }
    if (filter?.status) {
      query.andWhere('question.status = :status', { status: filter.status });
    }
    if (filter?.institutionId) {
      query.andWhere('question.institutionId = :institutionId', { institutionId: filter.institutionId });
    }
    if (filter?.createdById) {
      query.andWhere('question.createdById = :createdById', { createdById: filter.createdById });
    }
    if (filter?.search) {
      query.andWhere('(question.title LIKE :search OR question.content LIKE :search)', {
        search: `%${filter.search}%`,
      });
    }
    if (filter?.tags && filter.tags.length > 0) {
      query.andWhere('question.tags LIKE :tags', { tags: `%${filter.tags[0]}%` });
    }

    return query.orderBy('question.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Question | null> {
    return this.questionRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });
  }

  async update(id: string, updateData: Partial<Question>): Promise<Question | null> {
    await this.questionRepository.update(id, updateData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.questionRepository.delete(id);
  }

  async activate(id: string): Promise<Question | null> {
    await this.questionRepository.update(id, { status: QuestionStatus.ACTIVE });
    return this.findOne(id);
  }

  async archive(id: string): Promise<Question | null> {
    await this.questionRepository.update(id, { status: QuestionStatus.ARCHIVED });
    return this.findOne(id);
  }

  async getRandomQuestions(
    filter: QuestionFilterDto,
    count: number
  ): Promise<Question[]> {
    const questions = await this.findAll({
      ...filter,
      status: QuestionStatus.ACTIVE,
    });

    const shuffled = questions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  async duplicateCheck(content: string): Promise<boolean> {
    const existing = await this.questionRepository.findOne({
      where: { content },
    });
    return !!existing;
  }

  async updateStats(id: string, isCorrect: boolean): Promise<void> {
    const question = await this.findOne(id);
    if (!question) return;

    const newAttemptCount = question.attemptCount + 1;
    let newSuccessRate = question.successRate;

    if (isCorrect) {
      newSuccessRate = ((Number(question.successRate) * question.attemptCount + 100) / newAttemptCount);
    } else {
      newSuccessRate = ((Number(question.successRate) * question.attemptCount) / newAttemptCount);
    }

    await this.questionRepository.update(id, {
      attemptCount: newAttemptCount,
      successRate: newSuccessRate,
    });
  }
}