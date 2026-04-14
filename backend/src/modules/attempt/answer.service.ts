import { Repository, getRepository } from 'typeorm';
import { Answer, Attempt, AttemptStatus } from '../attempt/attempt.entity';
import { Question, QuestionType } from '../question/question.entity';
import { Test, TestStatus } from '../assessment/assessment.entity';

export interface SaveAnswerDto {
  attemptId: string;
  questionId: string;
  sectionId?: string;
  userAnswer: string;
  isAutoSaved?: boolean;
}

export interface EvaluateAnswerDto {
  answerId: string;
}

export class AnswerService {
  constructor(
    private answerRepository: Repository<Answer>,
    private attemptRepository: Repository<Attempt>,
    private questionRepository: Repository<Question>
  ) {}

  async saveAnswer(dto: SaveAnswerDto): Promise<Answer> {
    const existingAnswer = await this.answerRepository.findOne({
      where: { attemptId: dto.attemptId, questionId: dto.questionId },
    });

    if (existingAnswer) {
      await this.answerRepository.update(existingAnswer.id, {
        userAnswer: dto.userAnswer,
        isAutoSaved: dto.isAutoSaved || false,
        updatedAt: new Date(),
      });
      return this.answerRepository.findOne({ where: { id: existingAnswer.id } }) as Promise<Answer>;
    }

    const answer = this.answerRepository.create({
      attemptId: dto.attemptId,
      questionId: dto.questionId,
      sectionId: dto.sectionId,
      userAnswer: dto.userAnswer,
      isAutoSaved: dto.isAutoSaved || false,
    });

    return this.answerRepository.save(answer);
  }

  async getAnswer(answerId: string): Promise<Answer | null> {
    return this.answerRepository.findOne({
      where: { id: answerId },
    });
  }

  async getAttemptAnswers(attemptId: string): Promise<Answer[]> {
    return this.answerRepository.find({
      where: { attemptId },
    });
  }

  async evaluateMcq(answer: Answer, correctAnswer: string): Promise<{ marks: number; isCorrect: boolean; feedback?: string }> {
    const isCorrect = answer.userAnswer?.toUpperCase() === correctAnswer?.toUpperCase();
    return {
      marks: isCorrect ? 1 : 0,
      isCorrect,
      feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${correctAnswer}`,
    };
  }

  async evaluateCoding(
    answer: Answer,
    question: Question,
    codeOutput: string
  ): Promise<{ marks: number; isCorrect: boolean; feedback: string }> {
    const testCases = question.testCases || [];
    let passedCases = 0;
    const visibleTestCases = testCases.filter((tc) => !tc.isHidden);

    for (const testCase of visibleTestCases) {
      if (codeOutput.trim() === testCase.expectedOutput.trim()) {
        passedCases++;
      }
    }

    const isCorrect = passedCases === visibleTestCases.length;
    const marksPerCase = Number(question.marks) / testCases.length;
    const marks = Math.round(passedCases * marksPerCase * 100) / 100;

    return {
      marks,
      isCorrect,
      feedback: `${passedCases}/${visibleTestCases.length} test cases passed`,
    };
  }

  async evaluateSubjective(
    answer: Answer,
    question: Question
  ): Promise<{ marks: number; isCorrect: boolean; feedback: string }> {
    return {
      marks: 0,
      isCorrect: false,
      feedback: 'Answer submitted for manual evaluation',
    };
  }

  async autoSaveAll(attemptId: string): Promise<number> {
    const answers = await this.answerRepository.find({
      where: { attemptId, isAutoSaved: false },
    });

    for (const answer of answers) {
      await this.answerRepository.update(answer.id, { isAutoSaved: true });
    }

    return answers.length;
  }

  async calculateResults(attemptId: string): Promise<Attempt> {
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new Error('Attempt not found');
    }

    const answers = await this.answerRepository.find({
      where: { attemptId },
    });

    let totalMarks = 0;
    let obtainedMarks = 0;

    for (const answer of answers) {
      totalMarks += Number(answer.marksObtained);
      if (answer.isCorrect) {
        obtainedMarks += Number(answer.marksObtained);
      }
    }

    await this.attemptRepository.update(attemptId, {
      totalMarks,
      obtainedMarks,
      status: AttemptStatus.EVALUATED,
    });

    return this.getAttemptWithResults(attemptId) as Promise<Attempt>;
  }

  async getAttemptWithResults(attemptId: string): Promise<Attempt | null> {
    return this.attemptRepository.findOne({
      where: { id: attemptId },
    });
  }
}