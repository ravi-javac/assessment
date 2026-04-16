import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Test, Section, Subsection, TestQuestion } from './assessment.entity';
import { AssessmentService, CreateTestDto, CreateSectionDto, CreateSubsectionDto, TestFilterDto, TestRules, QuestionRules } from './assessment.service';

const testRepository = getRepository(Test);
const sectionRepository = getRepository(Section);
const subsectionRepository = getRepository(Subsection);
const testQuestionRepository = getRepository(TestQuestion);

const assessmentService = new AssessmentService(
  testRepository,
  sectionRepository,
  testQuestionRepository
);

export class AssessmentController {
  async getQuestionRules(req: Request, res: Response): Promise<void> {
    try {
      const rules = await assessmentService.getEffectiveQuestionRulesForTestQuestion(req.params.testQuestionId);

      res.json({
        success: true,
        data: rules,
      });
    } catch (error) {
      console.error('Get question rules error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getTestRules(req: Request, res: Response): Promise<void> {
    try {
      const rules = await assessmentService.getTestRules(req.params.testId);

      res.json({
        success: true,
        data: rules,
      });
    } catch (error) {
      console.error('Get test rules error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getSectionRules(req: Request, res: Response): Promise<void> {
    try {
      const rules = await assessmentService.getEffectiveRulesForSection(req.params.sectionId);

      res.json({
        success: true,
        data: rules,
      });
    } catch (error) {
      console.error('Get section rules error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getSubsectionRules(req: Request, res: Response): Promise<void> {
    try {
      const rules = await assessmentService.getEffectiveRulesForSubsection(req.params.subsectionId);

      res.json({
        success: true,
        data: rules,
      });
    } catch (error) {
      console.error('Get subsection rules error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getTestWithSections(req: Request, res: Response): Promise<void> {
    try {
      const test = await assessmentService.getTestWithSections(req.params.testId);

      res.json({
        success: true,
        data: test,
      });
    } catch (error) {
      console.error('Get test with sections error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getTestTotals(req: Request, res: Response): Promise<void> {
    try {
      const totals = await assessmentService.calculateTestTotals(req.params.testId);

      res.json({
        success: true,
        data: totals,
      });
    } catch (error) {
      console.error('Get test totals error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getSectionSettingsWithInheritance(req: Request, res: Response): Promise<void> {
    try {
      const settings = await assessmentService.getSectionSettingsWithInheritance(req.params.sectionId);

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      console.error('Get section settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getSubsectionSettingsWithInheritance(req: Request, res: Response): Promise<void> {
    try {
      const settings = await assessmentService.getSubsectionSettingsWithInheritance(req.params.subsectionId);

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      console.error('Get subsection settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async createTest(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const test = await assessmentService.createTest({
        ...req.body,
        createdById: userId,
      });

      res.status(201).json({
        success: true,
        message: 'Test created successfully',
        data: test,
      });
    } catch (error) {
      console.error('Create test error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getAllTests(req: Request, res: Response): Promise<void> {
    try {
      const { status, visibility, search, institutionId, courseId } = req.query;
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;

      const filter: TestFilterDto = {
        status: status as any,
        visibility: visibility as any,
        search: search as string,
        institutionId: institutionId as string,
        courseId: courseId as string,
        userId,
        userRole
      };

      const tests = await assessmentService.findAllTests(filter);

      res.json({
        success: true,
        data: tests,
      });
    } catch (error) {
      console.error('Get tests error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getTest(req: Request, res: Response): Promise<void> {
    try {
      const test = await assessmentService.findTestById(req.params.id);

      if (!test) {
        res.status(404).json({
          success: false,
          message: 'Test not found',
        });
        return;
      }

      res.json({
        success: true,
        data: test,
      });
    } catch (error) {
      console.error('Get test error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async updateTest(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      const test = await assessmentService.updateTest(req.params.id, req.body, userId, userRole);

      if (!test) {
        res.status(404).json({
          success: false,
          message: 'Test not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Test updated successfully',
        data: test,
      });
    } catch (error: any) {
      console.error('Update test error:', error);
      res.status(error.message.includes('Access denied') ? 403 : 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }
  async deleteTest(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      await assessmentService.deleteTest(req.params.id, userId, userRole);

      res.json({
        success: true,
        message: 'Test deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete test error:', error);
      res.status(error.message.includes('Access denied') ? 403 : 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async publishTest(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      const test = await assessmentService.publishTest(req.params.id, userId, userRole);

      if (!test) {
        res.status(404).json({
          success: false,
          message: 'Test not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Test published',
        data: test,
      });
    } catch (error: any) {
      console.error('Publish test error:', error);
      let statusCode = 500;
      if (error.message === 'Test must have a duration set before publishing') statusCode = 400;
      if (error.message.includes('Access denied')) statusCode = 403;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async goLive(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      const test = await assessmentService.goLive(req.params.id, userId, userRole);

      if (!test) {
        res.status(404).json({
          success: false,
          message: 'Test not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Test is now live',
        data: test,
      });
    } catch (error: any) {
      console.error('Go live error:', error);
      res.status(error.message.includes('Access denied') ? 403 : 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async pauseTest(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      const test = await assessmentService.pauseTest(req.params.id, userId, userRole);

      if (!test) {
        res.status(404).json({
          success: false,
          message: 'Test not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Test paused',
        data: test,
      });
    } catch (error: any) {
      console.error('Pause test error:', error);
      res.status(error.message.includes('Access denied') ? 403 : 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async generateAccessCode(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      const code = await assessmentService.generateAccessCode(req.params.id, userId, userRole);

      res.json({
        success: true,
        data: { accessCode: code },
      });
    } catch (error: any) {
      console.error('Generate access code error:', error);
      res.status(error.message.includes('Access denied') ? 403 : 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async createSection(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      const section = await assessmentService.createSection(req.body, userId, userRole);

      res.status(201).json({
        success: true,
        message: 'Section created successfully',
        data: section,
      });
    } catch (error: any) {
      console.error('Create section error:', error);
      res.status(error.message.includes('Access denied') ? 403 : 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async getSections(req: Request, res: Response): Promise<void> {
    try {
      const sections = await assessmentService.findSectionsByTest(req.params.testId);

      res.json({
        success: true,
        data: sections,
      });
    } catch (error) {
      console.error('Get sections error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async updateSection(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      const section = await assessmentService.updateSection(req.params.id, req.body, userId, userRole);

      if (!section) {
        res.status(404).json({
          success: false,
          message: 'Section not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Section updated',
        data: section,
      });
    } catch (error: any) {
      console.error('Update section error:', error);
      res.status(error.message.includes('Access denied') ? 403 : 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async deleteSection(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      await assessmentService.deleteSection(req.params.id, userId, userRole);

      res.json({
        success: true,
        message: 'Section deleted',
      });
    } catch (error: any) {
      console.error('Delete section error:', error);
      res.status(error.message.includes('Access denied') ? 403 : 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async createSubsection(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      const subsection = await assessmentService.createSubsection(req.body, userId, userRole);

      res.status(201).json({
        success: true,
        message: 'Subsection created successfully',
        data: subsection,
      });
    } catch (error: any) {
      console.error('Create subsection error:', error);
      res.status(error.message.includes('Access denied') ? 403 : 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async getSubsections(req: Request, res: Response): Promise<void> {
    try {
      const subsections = await assessmentService.findSubsectionsBySection(req.params.sectionId);

      res.json({
        success: true,
        data: subsections,
      });
    } catch (error) {
      console.error('Get subsections error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async updateSubsection(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      const subsection = await assessmentService.updateSubsection(req.params.id, req.body, userId, userRole);

      if (!subsection) {
        res.status(404).json({
          success: false,
          message: 'Subsection not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Subsection updated',
        data: subsection,
      });
    } catch (error: any) {
      console.error('Update subsection error:', error);
      res.status(error.message.includes('Access denied') ? 403 : 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async deleteSubsection(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      await assessmentService.deleteSubsection(req.params.id, userId, userRole);

      res.json({
        success: true,
        message: 'Subsection deleted',
      });
    } catch (error: any) {
      console.error('Delete subsection error:', error);
      res.status(error.message.includes('Access denied') ? 403 : 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async addQuestion(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      const { questionId, sectionId, subsectionId, marks, order, questionSettings } = req.body;
      const testQuestion = await assessmentService.addQuestionToTest(
        req.params.testId,
        questionId,
        sectionId,
        subsectionId,
        marks,
        order,
        questionSettings,
        userId,
        userRole
      );

      res.status(201).json({
        success: true,
        message: 'Question added to test',
        data: testQuestion,
      });
    } catch (error: any) {
      console.error('Add question error:', error);
      res.status(error.message.includes('Access denied') ? 403 : 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async removeQuestion(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      await assessmentService.removeQuestionFromTest(req.params.testQuestionId, userId, userRole);

      res.json({
        success: true,
        message: 'Question removed from test',
      });
    } catch (error: any) {
      console.error('Remove question error:', error);
      res.status(error.message.includes('Access denied') ? 403 : 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async getTestQuestions(req: Request, res: Response): Promise<void> {
    try {
      const questions = await assessmentService.getTestQuestions(req.params.testId);

      res.json({
        success: true,
        data: questions,
      });
    } catch (error) {
      console.error('Get test questions error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async cloneTest(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      const { newTitle } = req.body;
      const test = await assessmentService.cloneTest(req.params.id, newTitle, userId, userRole);

      res.status(201).json({
        success: true,
        message: 'Test cloned successfully',
        data: test,
      });
    } catch (error: any) {
      console.error('Clone test error:', error);
      res.status(error.message.includes('Access denied') ? 403 : 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async getScoreDistribution(req: Request, res: Response): Promise<void> {
    try {
      const distribution = await assessmentService.getScoreDistribution(req.params.testId);
      res.json({ success: true, data: distribution });
    } catch (error) {
      console.error('Get score distribution error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getQuestionAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await assessmentService.getQuestionAnalytics(req.params.testId);
      res.json({ success: true, data: analytics });
    } catch (error) {
      console.error('Get question analytics error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getStudentPerformance(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const performance = await assessmentService.getStudentPerformance(req.params.testId, studentId);
      res.json({ success: true, data: performance });
    } catch (error) {
      console.error('Get student performance error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async sendResultEmail(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.body;
      const result = await assessmentService.sendResultEmail(req.params.testId, studentId);
      res.json({ success: true, data: { sent: result } });
    } catch (error) {
      console.error('Send result email error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async createInvitation(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const invitation = await assessmentService.createInvitation(req.params.testId, email);
      res.json({ success: true, data: invitation });
    } catch (error) {
      console.error('Create invitation error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}