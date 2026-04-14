import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Test, TestStatus } from '../assessment/assessment.entity';
import { Attempt, AttemptStatus } from '../attempt/attempt.entity';
import { Question, QuestionType } from '../question/question.entity';
import { TestQuestion } from '../assessment/assessment.entity';

export interface StartExamDto {
  userId: string;
  testId: string;
  ipAddress?: string;
  deviceInfo?: string;
  browserInfo?: string;
}

export interface ValidateDeviceDto {
  testId: string;
  ipAddress?: string;
  deviceInfo?: string;
}

export class ExamService {
  constructor(
    private testRepository: Repository<Test>,
    private attemptRepository: Repository<Attempt>
  ) {}

  async startExam(dto: StartExamDto): Promise<Attempt> {
    const test = await this.testRepository.findOne({
      where: { id: dto.testId },
    });

    if (!test) {
      throw new Error('Test not found');
    }

    if (test.status !== TestStatus.LIVE) {
      throw new Error('Test is not available');
    }

    const now = new Date();
    if (test.startDate && now < new Date(test.startDate)) {
      throw new Error('Test has not started yet');
    }
    if (test.endDate && now > new Date(test.endDate)) {
      throw new Error('Test has ended');
    }

    const attempt = this.attemptRepository.create({
      userId: dto.userId,
      testId: dto.testId,
      status: AttemptStatus.IN_PROGRESS,
      startedAt: now,
      ipAddress: dto.ipAddress,
      deviceInfo: dto.deviceInfo,
      browserInfo: dto.browserInfo,
    });

    return this.attemptRepository.save(attempt);
  }

  async getAttempt(attemptId: string): Promise<Attempt | null> {
    return this.attemptRepository.findOne({
      where: { id: attemptId },
      relations: ['test'],
    });
  }

  async submitExam(attemptId: string): Promise<Attempt> {
    const attempt = await this.getAttempt(attemptId);
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new Error('Exam already submitted');
    }

    const attemptTest = await this.testRepository.findOne({
      where: { id: attempt.testId },
    });

    if (attemptTest) {
      const marksNeeded = Number(attemptTest.passingMarks);
      const isPassed = attempt.obtainedMarks >= marksNeeded;
      
      const percentage = attempt.totalMarks > 0 
        ? (attempt.obtainedMarks / attempt.totalMarks) * 100 
        : 0;

      await this.attemptRepository.update(attemptId, {
        status: AttemptStatus.SUBMITTED,
        submittedAt: new Date(),
        isPassed,
        percentage,
      });
    }

    return this.getAttempt(attemptId) as Promise<Attempt>;
  }

  async autoSubmit(attemptId: string): Promise<Attempt> {
    const now = new Date();
    const attempt = await this.getAttempt(attemptId);
    
    if (!attempt || !attempt.startedAt) {
      throw new Error('Attempt not found');
    }

    const timeTaken = Math.floor((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000);
    
    await this.attemptRepository.update(attemptId, {
      status: AttemptStatus.AUTO_SUBMITTED,
      submittedAt: now,
      timeTaken,
    });

    return this.getAttempt(attemptId) as Promise<Attempt>;
  }

  async validateDevice(dto: ValidateDeviceDto): Promise<{ valid: boolean; reason?: string }> {
    const test = await this.testRepository.findOne({
      where: { id: dto.testId },
    });

    if (!test) {
      return { valid: false, reason: 'Test not found' };
    }

    if (test.restrictIP && dto.ipAddress) {
      if (test.allowedIPs && !test.allowedIPs.includes(dto.ipAddress)) {
        return { valid: false, reason: 'IP address not allowed' };
      }
    }

    return { valid: true };
  }

  async checkMaxAttempts(userId: string, testId: string): Promise<{ allowed: boolean; remaining: number }> {
    const test = await this.testRepository.findOne({
      where: { id: testId },
    });

    if (!test) {
      return { allowed: false, remaining: 0 };
    }

    const attemptCount = await this.attemptRepository.count({
      where: { userId, testId },
    });

    const remaining = test.maxAttempts - attemptCount;
    return {
      allowed: remaining > 0,
      remaining,
    };
  }

  async getTestForAttempt(testId: string): Promise<any> {
    const test = await this.testRepository.findOne({
      where: { id: testId },
    });

    if (!test) {
      throw new Error('Test not found');
    }

    const testQuestionRepository = AppDataSource.getRepository(TestQuestion);
    const testQuestions = await testQuestionRepository.find({
      where: { testId },
      relations: ['question'],
    });

    return {
      id: test.id,
      title: test.title,
      description: test.description,
      duration: test.duration,
      instructions: test.instructions,
      showResults: test.showResults,
      showCorrectAnswers: test.showCorrectAnswers,
      shuffledQuestions: test.shuffledQuestions,
      shuffledOptions: test.shuffledOptions,
      questions: testQuestions.map((tq) => {
        const question = tq.question;
        return {
          id: tq.id,
          questionId: question.id,
          title: question.title,
          content: question.content,
          type: question.type,
          marks: tq.marks,
          options: question.type === QuestionType.MCQ 
            ? question.options?.map((o) => ({ key: o.key, value: o.value }))
            : undefined,
          codeTemplate: question.type === QuestionType.CODING ? question.codeTemplate : undefined,
          language: question.type === QuestionType.CODING ? question.language : undefined,
          testCases: question.type === QuestionType.CODING ? question.testCases : undefined,
        };
      }),
    };
  }

  async resumeAttempt(attemptId: string): Promise<Attempt | null> {
    const attempt = await this.getAttempt(attemptId);
    
    if (!attempt || attempt.status !== AttemptStatus.IN_PROGRESS) {
      return null;
    }

    return attempt;
  }
}