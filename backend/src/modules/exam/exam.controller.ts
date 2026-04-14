import { Request, Response } from 'express';
import { AppDataSource } from '../../config/database';
import { Test } from '../assessment/assessment.entity';
import { Attempt, Answer } from '../attempt/attempt.entity';
import { ExamService } from './exam.service';
import { AnswerService } from '../attempt/answer.service';

const testRepository = AppDataSource.getRepository(Test);
const attemptRepository = AppDataSource.getRepository(Attempt);
const answerRepository = AppDataSource.getRepository(Answer);

const examService = new ExamService(testRepository, attemptRepository);
const answerService = new AnswerService(answerRepository, attemptRepository, AppDataSource.getRepository(Answer) as any);

export class ExamController {
  async startExam(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { testId, ipAddress, deviceInfo, browserInfo } = req.body;

      const deviceValidation = await examService.validateDevice({
        testId,
        ipAddress,
        deviceInfo,
      });

      if (!deviceValidation.valid) {
        res.status(403).json({
          success: false,
          message: deviceValidation.reason,
        });
        return;
      }

      const attemptsCheck = await examService.checkMaxAttempts(userId, testId);
      if (!attemptsCheck.allowed) {
        res.status(403).json({
          success: false,
          message: `Maximum attempts reached. Remaining: ${attemptsCheck.remaining}`,
        });
        return;
      }

      const attempt = await examService.startExam({
        userId,
        testId,
        ipAddress,
        deviceInfo,
        browserInfo,
      });

      res.status(201).json({
        success: true,
        message: 'Exam started successfully',
        data: {
          attemptId: attempt.id,
          startedAt: attempt.startedAt,
        },
      });
    } catch (error: any) {
      console.error('Start exam error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async getTestQuestions(req: Request, res: Response): Promise<void> {
    try {
      const { testId } = req.params;
      const test = await examService.getTestForAttempt(testId);

      res.json({
        success: true,
        data: test,
      });
    } catch (error: any) {
      console.error('Get test questions error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async saveAnswer(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId, questionId, sectionId, userAnswer, isAutoSaved } = req.body;

      await answerService.saveAnswer({
        attemptId,
        questionId,
        sectionId,
        userAnswer,
        isAutoSaved,
      });

      res.json({
        success: true,
        message: 'Answer saved',
      });
    } catch (error: any) {
      console.error('Save answer error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async submitExam(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const { questionnaireResponses, testId, studentId, questionnaireId } = req.body;

      await answerService.autoSaveAll(attemptId);
      const attempt = await examService.submitExam(attemptId);

      if (questionnaireResponses && questionnaireResponses.length > 0 && testId && studentId) {
        try {
          const { questionnaireService } = await import('../questionnaire/questionnaire.service');
          await questionnaireService.saveResponses(testId, studentId, questionnaireId, questionnaireResponses);
        } catch (e) {
          console.error('Failed to save questionnaire responses:', e);
        }
      }

      res.json({
        success: true,
        message: 'Exam submitted successfully',
        data: {
          attemptId: attempt.id,
          status: attempt.status,
          submittedAt: attempt.submittedAt,
        },
      });
    } catch (error: any) {
      console.error('Submit exam error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async getAttempt(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const attempt = await examService.getAttempt(attemptId);

      if (!attempt) {
        res.status(404).json({
          success: false,
          message: 'Attempt not found',
        });
        return;
      }

      const answers = await answerService.getAttemptAnswers(attemptId);

      res.json({
        success: true,
        data: {
          ...attempt,
          answers,
        },
      });
    } catch (error: any) {
      console.error('Get attempt error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getResults(req: Request, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const attempt = await answerService.calculateResults(attemptId);

      res.json({
        success: true,
        data: attempt,
      });
    } catch (error: any) {
      console.error('Get results error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async validateDevice(req: Request, res: Response): Promise<void> {
    try {
      const { testId, ipAddress, deviceInfo } = req.body;

      const result = await examService.validateDevice({
        testId,
        ipAddress,
        deviceInfo,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Validate device error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}