import { Request, Response } from 'express';
import { BatchService } from './batch.service';

const batchService = new BatchService();

export class BatchController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const batches = await batchService.findAll();
      res.json({ success: true, data: batches });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const batch = await batchService.findOne(req.params.id);
      if (!batch) {
        res.status(404).json({ success: false, message: 'Batch not found' });
        return;
      }
      res.json({ success: true, data: batch });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const batch = await batchService.create(req.body);
      res.status(201).json({ success: true, data: batch });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const batch = await batchService.update(req.params.id, req.body);
      res.json({ success: true, data: batch });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await batchService.delete(req.params.id);
      res.json({ success: true, message: 'Batch deleted' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async assignFaculty(req: Request, res: Response): Promise<void> {
    try {
      const { facultyIds } = req.body;
      const batch = await batchService.assignFacultyToBatch(req.params.id, facultyIds);
      res.json({ success: true, data: batch });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async previewExcel(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }
      const students = await batchService.parseExcelStudents(req.file.buffer);
      res.json({ success: true, data: students });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async bulkAddStudents(req: Request, res: Response): Promise<void> {
    try {
      const { students } = req.body;
      const result = await batchService.bulkAddStudentsToBatch(req.params.id, students);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
