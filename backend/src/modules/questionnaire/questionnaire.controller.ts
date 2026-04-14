import { Request, Response } from 'express';
import { questionnaireService } from './questionnaire.service';

class QuestionnaireController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { institutionId } = req.query;
      const questionnaires = await questionnaireService.findAll({
        institutionId: institutionId as string,
      });
      res.json({
        success: true,
        data: questionnaires,
      });
    } catch (error) {
      console.error('Get questionnaires error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const questionnaire = await questionnaireService.findById(req.params.id);
      if (!questionnaire) {
        res.status(404).json({
          success: false,
          message: 'Questionnaire not found',
        });
        return;
      }
      res.json({
        success: true,
        data: questionnaire,
      });
    } catch (error) {
      console.error('Get questionnaire error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const questionnaire = await questionnaireService.create(req.body);
      res.json({
        success: true,
        data: questionnaire,
      });
    } catch (error) {
      console.error('Create questionnaire error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const questionnaire = await questionnaireService.update(req.params.id, req.body);
      if (!questionnaire) {
        res.status(404).json({
          success: false,
          message: 'Questionnaire not found',
        });
        return;
      }
      res.json({
        success: true,
        data: questionnaire,
      });
    } catch (error) {
      console.error('Update questionnaire error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await questionnaireService.delete(req.params.id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Questionnaire not found',
        });
        return;
      }
      res.json({
        success: true,
        message: 'Questionnaire deleted',
      });
    } catch (error) {
      console.error('Delete questionnaire error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async saveResponses(req: Request, res: Response): Promise<void> {
    try {
      const { testId, studentId, questionnaireId, responses } = req.body;
      await questionnaireService.saveResponses(testId, studentId, questionnaireId, responses);
      res.json({
        success: true,
        message: 'Responses saved',
      });
    } catch (error) {
      console.error('Save responses error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getResponses(req: Request, res: Response): Promise<void> {
    try {
      const responses = await questionnaireService.getResponses(req.params.testId);
      res.json({
        success: true,
        data: responses,
      });
    } catch (error) {
      console.error('Get responses error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getStudentResponses(req: Request, res: Response): Promise<void> {
    try {
      const responses = await questionnaireService.getStudentResponses(req.params.testId, req.params.studentId);
      res.json({
        success: true,
        data: responses,
      });
    } catch (error) {
      console.error('Get student responses error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

export const questionnaireController = new QuestionnaireController();