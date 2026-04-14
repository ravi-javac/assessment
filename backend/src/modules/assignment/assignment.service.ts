import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Assignment, AssignmentSubmission, AssignmentStatus } from './assignment.entity';
import { User } from '../user/user.entity';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export interface CreateAssignmentDto {
  title: string;
  description?: string;
  courseId?: string;
  institutionId?: string;
  createdById: string;
  dueDate?: Date;
  totalMarks?: number;
  allowLateSubmission?: boolean;
  latePenaltyPercent?: number;
  allowFileUpload?: boolean;
  allowTextSubmission?: boolean;
  maxFileSizeMB?: number;
  allowedFileTypes?: string[];
  maxFiles?: number;
  instructions?: string;
}

export interface SubmitAssignmentDto {
  assignmentId: string;
  studentId: string;
  textContent?: string;
  files?: { name: string; url: string; size: number }[];
}

export class AssignmentService {
  private userRepository: Repository<User>;
  private assignmentRepository: Repository<Assignment>;
  private submissionRepository: Repository<AssignmentSubmission>;

  constructor(
    assignmentRepository: Repository<Assignment>,
    submissionRepository: Repository<AssignmentSubmission>
  ) {
    this.assignmentRepository = assignmentRepository;
    this.submissionRepository = submissionRepository;
    this.userRepository = AppDataSource.getRepository(User);
  }

  async create(dto: CreateAssignmentDto): Promise<Assignment> {
    const assignment = this.assignmentRepository.create({
      ...dto,
      status: AssignmentStatus.DRAFT,
    });
    return this.assignmentRepository.save(assignment);
  }

  async getAssignment(id: string): Promise<Assignment | null> {
    return this.assignmentRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });
  }

  async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    return this.assignmentRepository.find({
      where: { courseId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateAssignment(id: string, data: Partial<Assignment>): Promise<Assignment | null> {
    await this.assignmentRepository.update(id, data);
    return this.getAssignment(id);
  }

  async publishAssignment(id: string): Promise<Assignment | null> {
    await this.assignmentRepository.update(id, { status: AssignmentStatus.PUBLISHED });
    return this.getAssignment(id);
  }

  async closeAssignment(id: string): Promise<Assignment | null> {
    await this.assignmentRepository.update(id, { status: AssignmentStatus.CLOSED });
    return this.getAssignment(id);
  }

  async submit(dto: SubmitAssignmentDto): Promise<AssignmentSubmission> {
    const assignment = await this.getAssignment(dto.assignmentId);
    if (!assignment) throw new Error('Assignment not found');

    if (assignment.dueDate && new Date() > assignment.dueDate) {
      if (!assignment.allowLateSubmission) {
        throw new Error('Submission deadline passed');
      }
    }

    const existing = await this.submissionRepository.findOne({
      where: { assignmentId: dto.assignmentId, studentId: dto.studentId },
    });

    if (existing) {
      existing.textContent = dto.textContent;
      existing.files = dto.files;
      existing.isLate = new Date() > (assignment.dueDate || new Date());
      existing.status = 'submitted' as any;
      await this.submissionRepository.save(existing);
      await this.updateSubmissionCount(dto.assignmentId);
      return existing;
    }

    const submission = this.submissionRepository.create({
      assignmentId: dto.assignmentId,
      studentId: dto.studentId,
      textContent: dto.textContent,
      files: dto.files,
      isLate: assignment.dueDate ? new Date() > assignment.dueDate : false,
      status: 'submitted' as any,
    });

    await this.submissionRepository.save(submission);
    await this.updateSubmissionCount(dto.assignmentId);
    return submission;
  }

  async updateSubmissionCount(assignmentId: string): Promise<void> {
    const count = await this.submissionRepository.count({
      where: { assignmentId },
    });
    await this.assignmentRepository.update(assignmentId, { totalSubmissions: count });
  }

  async getSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
    return this.submissionRepository.find({
      where: { assignmentId },
      relations: ['student'],
      order: { submittedAt: 'DESC' },
    });
  }

  async getSubmission(id: string): Promise<AssignmentSubmission | null> {
    return this.submissionRepository.findOne({
      where: { id },
      relations: ['student', 'assignment', 'gradedBy'],
    });
  }

  async gradeSubmission(
    submissionId: string,
    gradedById: string,
    marksObtained: number,
    feedback: string
  ): Promise<AssignmentSubmission> {
    const submission = await this.getSubmission(submissionId);
    if (!submission) throw new Error('Submission not found');

    submission.marksObtained = marksObtained;
    submission.feedback = feedback;
    submission.gradedById = gradedById;
    submission.gradedAt = new Date();
    submission.status = 'graded' as any;

    await this.submissionRepository.save(submission);
    await this.updateGradedCount(submission.assignmentId);
    return submission;
  }

  async updateGradedCount(assignmentId: string): Promise<void> {
    const count = await this.submissionRepository.count({
      where: { assignmentId, status: 'graded' as any },
    });
    await this.assignmentRepository.update(assignmentId, { gradedSubmissions: count });
  }

  async getStudentSubmission(
    assignmentId: string,
    studentId: string
  ): Promise<AssignmentSubmission | null> {
    return this.submissionRepository.findOne({
      where: { assignmentId, studentId },
    });
  }

  async getStudentSubmissions(studentId: string): Promise<AssignmentSubmission[]> {
    return this.submissionRepository.find({
      where: { studentId },
      relations: ['assignment'],
      order: { submittedAt: 'DESC' },
    });
  }

  async getAssignmentReport(assignmentId: string): Promise<any> {
    const assignment = await this.getAssignment(assignmentId);
    const submissions = await this.getSubmissions(assignmentId);

    const graded = submissions.filter((s) => s.status === 'graded');
    const pending = submissions.filter((s) => s.status === 'submitted');

    let totalMarks = 0;
    for (const sub of graded) {
      totalMarks += Number(sub.marksObtained || 0);
    }
    const avgMarks = graded.length > 0 ? totalMarks / graded.length : 0;

    return {
      assignment,
      summary: {
        total: submissions.length,
        graded: graded.length,
        pending: pending.length,
        averageMarks: avgMarks.toFixed(2),
      },
      submissions,
    };
  }

  async returnSubmission(submissionId: string): Promise<AssignmentSubmission> {
    const submission = await this.getSubmission(submissionId);
    if (!submission) throw new Error('Submission not found');

    submission.status = 'returned' as any;
    return this.submissionRepository.save(submission);
  }

  async bulkImportStudents(assignmentId: string, studentIds: string[]): Promise<number> {
    let imported = 0;
    for (const studentId of studentIds) {
      const existing = await this.submissionRepository.findOne({
        where: { assignmentId, studentId },
      });
      if (!existing) {
        const submission = this.submissionRepository.create({
          assignmentId,
          studentId,
          status: 'not_submitted' as any,
        });
        await this.submissionRepository.save(submission);
        imported++;
      }
    }
    return imported;
  }

  saveFile(file: { originalname: string; buffer: Buffer; size: number }): { name: string; url: string; size: number } {
    const uploadDir = path.join(process.cwd(), 'uploads', 'assignments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${uuidv4()}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    return {
      name: file.originalname,
      url: `/uploads/assignments/${fileName}`,
      size: file.size,
    };
  }
}