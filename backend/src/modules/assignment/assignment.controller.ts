import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Assignment, AssignmentSubmission } from './assignment.entity';
import { AssignmentService } from './assignment.service';

const assignmentRepository = getRepository(Assignment);
const submissionRepository = getRepository(AssignmentSubmission);

const assignmentService = new AssignmentService(assignmentRepository, submissionRepository);

export class AssignmentController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const assignment = await assignmentService.create({ ...req.body, createdById: userId });
      res.status(201).json({ success: true, data: assignment });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async get(req: Request, res: Response): Promise<void> {
    try {
      const assignment = await assignmentService.getAssignment(req.params.id);
      if (!assignment) {
        res.status(404).json({ success: false, message: 'Assignment not found' });
        return;
      }
      res.json({ success: true, data: assignment });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getByCourse(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.query;
      const assignments = await assignmentService.getAssignmentsByCourse(courseId as string);
      res.json({ success: true, data: assignments });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const assignment = await assignmentService.updateAssignment(req.params.id, req.body);
      res.json({ success: true, data: assignment });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async publish(req: Request, res: Response): Promise<void> {
    try {
      const assignment = await assignmentService.publishAssignment(req.params.id);
      res.json({ success: true, message: 'Assignment published', data: assignment });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async close(req: Request, res: Response): Promise<void> {
    try {
      const assignment = await assignmentService.closeAssignment(req.params.id);
      res.json({ success: true, message: 'Assignment closed', data: assignment });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async submit(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { textContent, files } = req.body;
      const submission = await assignmentService.submit({
        ...req.body,
        studentId: userId,
        textContent,
        files,
      });
      res.json({ success: true, message: 'Submitted successfully', data: submission });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const submissions = await assignmentService.getSubmissions(req.params.id);
      res.json({ success: true, data: submissions });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async grade(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { marksObtained, feedback } = req.body;
      const submission = await assignmentService.gradeSubmission(
        req.params.submissionId,
        userId,
        marksObtained,
        feedback
      );
      res.json({ success: true, message: 'Graded successfully', data: submission });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getReport(req: Request, res: Response): Promise<void> {
    try {
      const report = await assignmentService.getAssignmentReport(req.params.id);
      res.json({ success: true, data: report });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getMySubmissions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const submissions = await assignmentService.getStudentSubmissions(userId);
      res.json({ success: true, data: submissions });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async returnSubmission(req: Request, res: Response): Promise<void> {
    try {
      const submission = await assignmentService.returnSubmission(req.params.submissionId);
      res.json({ success: true, message: 'Returned to student', data: submission });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}