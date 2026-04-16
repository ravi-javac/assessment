import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Assignment, AssignmentSubmission, AssignmentStatus, AssignmentQuestion, AttemptAnswer, AssignmentType } from './assignment.entity';
import { User, UserRole } from '../user/user.entity';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export interface CreateAssignmentDto {
  title: string;
  description?: string;
  type?: AssignmentType;
  courseId?: string;
  semester?: string;
  batch?: string;
  section?: string;
  institutionId?: string;
  createdById: string;
  startDate?: Date;
  dueDate?: Date;
  totalMarks?: number;
  maxAttempts?: number;
  durationMinutes?: number;
  allowLateSubmission?: boolean;
  latePenaltyPercent?: number;
  allowFileUpload?: boolean;
  allowTextSubmission?: boolean;
  maxFileSizeMB?: number;
  allowedFileTypes?: string[];
  maxFiles?: number;
  instructions?: string;
  readingMaterials?: { title: string; url: string; type: string }[];
  questions?: { questionId: string; marks: number; order: number }[];
}

export interface SubmitAssignmentDto {
  assignmentId: string;
  studentId: string;
  textContent?: string;
  files?: { name: string; url: string; size: number }[];
  answers?: { questionId: string; answer?: string; codingAnswer?: any; mcqAnswer?: any }[];
  status?: string;
}

export class AssignmentService {
  private userRepository: Repository<User>;
  private assignmentRepository: Repository<Assignment>;
  private submissionRepository: Repository<AssignmentSubmission>;
  private assignmentQuestionRepository: Repository<AssignmentQuestion>;
  private attemptAnswerRepository: Repository<AttemptAnswer>;

  constructor(
    assignmentRepository: Repository<Assignment>,
    submissionRepository: Repository<AssignmentSubmission>
  ) {
    this.assignmentRepository = assignmentRepository;
    this.submissionRepository = submissionRepository;
    this.userRepository = AppDataSource.getRepository(User);
    this.assignmentQuestionRepository = AppDataSource.getRepository(AssignmentQuestion);
    this.attemptAnswerRepository = AppDataSource.getRepository(AttemptAnswer);
  }

  async create(dto: CreateAssignmentDto): Promise<Assignment> {
    const { questions, ...assignmentData } = dto;
    
    const assignment = this.assignmentRepository.create({
      ...assignmentData,
      status: AssignmentStatus.DRAFT,
    });
    
    const savedAssignment = await this.assignmentRepository.save(assignment);
    
    if (questions && questions.length > 0) {
      const assignmentQuestions = questions.map(q => 
        this.assignmentQuestionRepository.create({
          assignmentId: savedAssignment.id,
          ...q
        })
      );
      await this.assignmentQuestionRepository.save(assignmentQuestions);
    }
    
    return this.getAssignment(savedAssignment.id) as Promise<Assignment>;
  }

  async findAll(filter?: { courseId?: string; status?: AssignmentStatus; userId?: string; userRole?: string }): Promise<Assignment[]> {
    const query = this.assignmentRepository.createQueryBuilder('assignment');

    if (filter?.courseId) {
      query.andWhere('assignment.courseId = :courseId', { courseId: filter.courseId });
    }
    if (filter?.status) {
      query.andWhere('assignment.status = :status', { status: filter.status });
    }

    // Faculty Restriction: Only see assignments assigned to their batches
    if (filter?.userRole === UserRole.FACULTY && filter?.userId) {
      const user = await this.userRepository.findOne({
        where: { id: filter.userId },
        relations: ['assignedBatches']
      });
      const batchIds = user?.assignedBatches.map(b => b.id) || [];
      
      if (batchIds.length > 0) {
        // Find assignments that have submissions from these batches
        query.andWhere(qb => {
          const subQuery = qb.subQuery()
            .select('sub.assignmentId')
            .from('assignment_submissions', 'sub')
            .leftJoin('users', 'u', 'u.id = sub.studentId')
            .where('u.batchId IN (:...batchIds)', { batchIds })
            .getQuery();
          return 'assignment.id IN ' + subQuery;
        });
      } else {
        // If no batches assigned, they can only see what they created
        query.andWhere('assignment.createdById = :userId', { userId: filter.userId });
      }
    }

    return query.orderBy('assignment.createdAt', 'DESC').getMany();
  }

  async getAssignment(id: string): Promise<Assignment | null> {
    return this.assignmentRepository.findOne({
      where: { id },
      relations: ['createdBy', 'questions', 'questions.question'],
    });
  }

  async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    return this.assignmentRepository.find({
      where: { courseId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateAssignment(id: string, data: Partial<CreateAssignmentDto>): Promise<Assignment | null> {
    const { questions, ...assignmentData } = data;
    
    if (Object.keys(assignmentData).length > 0) {
      await this.assignmentRepository.update(id, assignmentData as any);
    }
    
    if (questions) {
      // Simple sync: delete existing and recreates
      await this.assignmentQuestionRepository.delete({ assignmentId: id });
      if (questions.length > 0) {
        const assignmentQuestions = questions.map(q => 
          this.assignmentQuestionRepository.create({
            assignmentId: id,
            ...q
          })
        );
        await this.assignmentQuestionRepository.save(assignmentQuestions);
      }
    }
    
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

  async deleteAssignment(id: string): Promise<void> {
    await this.assignmentRepository.delete(id);
  }

  async approveAssignment(id: string): Promise<Assignment | null> {
    await this.assignmentRepository.update(id, { isAdminApproved: true });
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

    // Check attempt count
    const attemptCount = await this.submissionRepository.count({
      where: { assignmentId: dto.assignmentId, studentId: dto.studentId },
    });

    if (attemptCount >= assignment.maxAttempts && !dto.status) {
       throw new Error('Maximum attempts reached');
    }

    const submission = this.submissionRepository.create({
      assignmentId: dto.assignmentId,
      studentId: dto.studentId,
      textContent: dto.textContent,
      files: dto.files,
      attemptNumber: attemptCount + 1,
      isLate: assignment.dueDate ? new Date() > assignment.dueDate : false,
      status: dto.status || 'submitted',
    });

    const savedSubmission = await this.submissionRepository.save(submission);

    if (dto.answers && dto.answers.length > 0) {
      const attemptAnswers = dto.answers.map(a => 
        this.attemptAnswerRepository.create({
          submissionId: savedSubmission.id,
          ...a
        })
      );
      await this.attemptAnswerRepository.save(attemptAnswers);
      
      // Auto-evaluate if possible
      await this.autoEvaluate(savedSubmission.id);
    }

    await this.updateSubmissionCount(dto.assignmentId);
    return this.getSubmission(savedSubmission.id) as Promise<AssignmentSubmission>;
  }

  async autoEvaluate(submissionId: string): Promise<void> {
    const submission = await this.getSubmission(submissionId);
    if (!submission) return;

    let totalMarks = 0;
    
    for (const answer of submission.answers) {
      const question = answer.question;
      if (!question) continue;

      if (question.type === 'mcq' && answer.mcqAnswer) {
        const isCorrect = question.correctAnswer === answer.mcqAnswer.selectedOption;
        answer.mcqAnswer.isCorrect = isCorrect;
        answer.marksObtained = isCorrect ? question.marks : 0;
        totalMarks += Number(answer.marksObtained);
        await this.attemptAnswerRepository.save(answer);
      }
      // Coding auto-eval logic could be more complex, involving test cases
    }

    submission.marksObtained = totalMarks;
    await this.submissionRepository.save(submission);
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
      relations: ['student', 'assignment', 'gradedBy', 'answers', 'answers.question'],
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
    submission.status = 'graded';

    await this.submissionRepository.save(submission);
    await this.updateGradedCount(submission.assignmentId);
    return submission;
  }

  async updateGradedCount(assignmentId: string): Promise<void> {
    const count = await this.submissionRepository.count({
      where: { assignmentId, status: 'graded' },
    });
    await this.assignmentRepository.update(assignmentId, { gradedSubmissions: count });
  }

  async getStudentSubmission(
    assignmentId: string,
    studentId: string
  ): Promise<AssignmentSubmission | null> {
    return this.submissionRepository.findOne({
      where: { assignmentId, studentId },
      order: { attemptNumber: 'DESC' },
      relations: ['answers', 'answers.question']
    });
  }

  async getStudentSubmissions(studentId: string): Promise<AssignmentSubmission[]> {
    return this.submissionRepository
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.assignment', 'assignment')
      .where('submission.studentId = :studentId', { studentId })
      .andWhere('assignment.status != :status', { status: AssignmentStatus.DRAFT })
      .orderBy('submission.submittedAt', 'DESC')
      .getMany();
  }

  async getAssignmentReport(assignmentId: string): Promise<any> {
    const assignment = await this.getAssignment(assignmentId);
    const submissions = await this.getSubmissions(assignmentId);

    const graded = submissions.filter((s) => s.status === 'graded');
    const pending = submissions.filter((s) => s.status === 'submitted');

    let totalMarksObtained = 0;
    for (const sub of graded) {
      totalMarksObtained += Number(sub.marksObtained || 0);
    }
    const avgMarks = graded.length > 0 ? totalMarksObtained / graded.length : 0;

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

    submission.status = 'returned';
    return this.submissionRepository.save(submission);
  }

  async assignToEmails(assignmentId: string, emails: string[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    console.log(`Assigning assignment ${assignmentId} to emails:`, emails);

    for (const email of emails) {
      try {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
          console.log(`User not found for email: ${email}`);
          failed++;
          continue;
        }

        console.log(`Found user ${user.id} for email: ${email}`);

        const existing = await this.submissionRepository.findOne({
          where: { assignmentId, studentId: user.id },
        });

        if (!existing) {
          const submission = this.submissionRepository.create({
            assignmentId,
            studentId: user.id,
            status: 'not_submitted',
          });
          await this.submissionRepository.save(submission);
          console.log(`Created new submission for user ${user.id}`);
          success++;
        } else {
          console.log(`User ${user.id} already assigned to this assignment`);
          // Already assigned
          success++;
        }
      } catch (e) {
        console.error(`Error assigning to ${email}:`, e);
        failed++;
      }
    }

    return { success, failed };
  }

  async assignToBatch(assignmentId: string, batchId: string): Promise<{ success: number }> {
    const students = await this.userRepository.find({
      where: { batchId, role: UserRole.STUDENT },
    });

    let success = 0;
    for (const student of students) {
      const existing = await this.submissionRepository.findOne({
        where: { assignmentId, studentId: student.id },
      });

      if (!existing) {
        const submission = this.submissionRepository.create({
          assignmentId,
          studentId: student.id,
          status: 'not_submitted',
        });
        await this.submissionRepository.save(submission);
        success++;
      }
    }

    return { success };
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
          status: 'not_submitted',
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