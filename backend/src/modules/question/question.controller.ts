import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Question } from './question.entity';
import { QuestionService, CreateQuestionDto, QuestionFilterDto } from './question.service';
import { BulkUploadService } from './bulkUpload.service';

const questionRepository = getRepository(Question);
const questionService = new QuestionService(questionRepository);
const bulkUploadService = new BulkUploadService();

export class QuestionController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const question = await questionService.create({
        ...req.body,
        createdById: userId,
      });

      res.status(201).json({
        success: true,
        message: 'Question created successfully',
        data: question,
      });
    } catch (error) {
      console.error('Create question error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async bulkCreate(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const questionsData = req.body.questions.map((q: any) => ({
        ...q,
        createdById: userId,
      }));

      const questions = await questionService.bulkCreate(questionsData);

      res.status(201).json({
        success: true,
        message: `${questions.length} questions created successfully`,
        data: questions,
      });
    } catch (error) {
      console.error('Bulk create questions error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { type, difficulty, status, tags, search, institutionId, page, limit } = req.query;
      const filter: QuestionFilterDto = {
        type: type as any,
        difficulty: difficulty as any,
        status: status as any,
        tags: tags ? [tags as string] : undefined,
        search: search as string,
        institutionId: institutionId as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      };

      const { data, total } = await questionService.findAll(filter);

      res.json({
        success: true,
        data,
        total,
      });
    } catch (error) {
      console.error('Get questions error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const question = await questionService.findOne(req.params.id);

      if (!question) {
        res.status(404).json({
          success: false,
          message: 'Question not found',
        });
        return;
      }

      res.json({
        success: true,
        data: question,
      });
    } catch (error) {
      console.error('Get question error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const question = await questionService.update(req.params.id, req.body);

      if (!question) {
        res.status(404).json({
          success: false,
          message: 'Question not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Question updated successfully',
        data: question,
      });
    } catch (error) {
      console.error('Update question error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await questionService.delete(req.params.id);

      res.json({
        success: true,
        message: 'Question deleted successfully',
      });
    } catch (error) {
      console.error('Delete question error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async activate(req: Request, res: Response): Promise<void> {
    try {
      const question = await questionService.activate(req.params.id);

      if (!question) {
        res.status(404).json({
          success: false,
          message: 'Question not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Question activated',
        data: question,
      });
    } catch (error) {
      console.error('Activate question error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async archive(req: Request, res: Response): Promise<void> {
    try {
      const question = await questionService.archive(req.params.id);

      if (!question) {
        res.status(404).json({
          success: false,
          message: 'Question not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Question archived',
        data: question,
      });
    } catch (error) {
      console.error('Archive question error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async checkDuplicate(req: Request, res: Response): Promise<void> {
    try {
      const { content } = req.body;
      const exists = await questionService.duplicateCheck(content);

      res.json({
        success: true,
        data: { isDuplicate: exists },
      });
    } catch (error) {
      console.error('Duplicate check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getRandom(req: Request, res: Response): Promise<void> {
    try {
      const { type, difficulty, count } = req.query;
      const filter: QuestionFilterDto = {
        type: type as any,
        difficulty: difficulty as any,
      };

      const questions = await questionService.getRandomQuestions(
        filter,
        parseInt(count as string) || 10
      );

      res.json({
        success: true,
        data: questions,
      });
    } catch (error) {
      console.error('Get random questions error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async bulkUploadMCQ(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
        return;
      }

      const buffer = req.file.buffer;
      const result = await bulkUploadService.processMCQExcelFile(buffer, userId);

      res.json({
        success: true,
        message: `Bulk upload completed: ${result.success} succeeded, ${result.failed} failed`,
        data: result,
      });
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }
}