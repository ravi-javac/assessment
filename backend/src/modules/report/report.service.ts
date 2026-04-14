import { getRepository } from 'typeorm';
import { Test, TestStatus } from '../assessment/assessment.entity';
import { Attempt, AttemptStatus } from '../attempt/attempt.entity';
import { Question } from '../question/question.entity';
import { Assignment, AssignmentSubmission } from '../assignment/assignment.entity';
import { AttendanceSession, AttendanceRecord } from '../attendance/attendance.entity';
import { Questionnaire } from '../questionnaire/questionnaire.entity';
import { QuestionnaireResponse } from '../questionnaire/questionnaireResponse.entity';
import { QuestionnaireField } from '../questionnaire/questionnaireField.entity';

export interface TestReportParams {
  testId: string;
  includeProctoring?: boolean;
  includeQuestions?: boolean;
}

export interface StudentReportParams {
  userId: string;
  courseId?: string;
  startDate?: Date;
  endDate?: Date;
}

export class ReportService {
  async generateTestReport(params: TestReportParams): Promise<any> {
    const testRepo = getRepository(Test);
    const attemptRepo = getRepository(Attempt);
    const questionRepo = getRepository(Question);

    const test = await testRepo.findOne({ where: { id: params.testId } });
    if (!test) throw new Error('Test not found');

    const attempts = await attemptRepo.find({
      where: { testId: params.testId },
      relations: ['user'],
    });

    const totalAttempts = attempts.length;
    const submittedAttempts = attempts.filter(a => 
      a.status === AttemptStatus.SUBMITTED || a.status === AttemptStatus.EVALUATED
    );
    const passedAttempts = attempts.filter(a => a.isPassed);

    let totalMarks = 0;
    for (const attempt of submittedAttempts) {
      totalMarks += Number(attempt.obtainedMarks || 0);
    }
    const avgMarks = submittedAttempts.length > 0 
      ? totalMarks / submittedAttempts.length 
      : 0;

    const scoreDistribution = {
      '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0
    };
    for (const attempt of attempts) {
      const pct = Number(attempt.percentage || 0);
      if (pct <= 25) scoreDistribution['0-25']++;
      else if (pct <= 50) scoreDistribution['26-50']++;
      else if (pct <= 75) scoreDistribution['51-75']++;
      else scoreDistribution['76-100']++;
    }

    const questions = params.includeQuestions 
      ? await questionRepo.find({ where: { id: undefined as any } })
      : [];

    return {
      test: {
        id: test.id,
        title: test.title,
        status: test.status,
        duration: test.duration,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
      },
      summary: {
        totalAttempts,
        submitted: submittedAttempts.length,
        passed: passedAttempts.length,
        passRate: totalAttempts > 0 ? (passedAttempts.length / totalAttempts * 100).toFixed(2) : '0',
        averageMarks: avgMarks.toFixed(2),
        averagePercentage: (avgMarks / Number(test.passingMarks) * 100).toFixed(2),
      },
      scoreDistribution,
      questions: questions.map(q => ({
        id: q.id,
        title: q.title,
        type: q.type,
        successRate: q.successRate,
      })),
      questionnaire: await this.getQuestionnaireData(test),
    };
  }

  async generateStudentReport(params: StudentReportParams): Promise<any> {
    const attemptRepo = getRepository(Attempt);
    const submissionRepo = getRepository(AssignmentSubmission);
    const recordRepo = getRepository(AttendanceRecord);

    const testAttempts = await attemptRepo.find({
      where: { userId: params.userId },
    });

    const assignments = await submissionRepo.find({
      where: { studentId: params.userId },
    });

    const attendance = await recordRepo.find({
      where: { userId: params.userId },
    });

    const testStats = {
      total: testAttempts.length,
      passed: testAttempts.filter(a => a.isPassed).length,
      totalMarks: testAttempts.reduce((sum, a) => sum + Number(a.obtainedMarks || 0), 0),
    };

    const assignmentStats = {
      total: assignments.length,
      submitted: assignments.filter(a => a.status === 'submitted').length,
      graded: assignments.filter(a => a.status === 'graded').length,
      totalMarks: assignments.reduce((sum, a) => sum + Number(a.marksObtained || 0), 0),
    };

    const attendanceStats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      late: attendance.filter(a => a.status === 'late').length,
      absent: attendance.filter(a => a.status === 'absent').length,
    };

    return {
      userId: params.userId,
      testPerformance: testStats,
      assignmentPerformance: assignmentStats,
      attendance: attendanceStats,
      overallScore: (
        (testStats.totalMarks * 0.5 + 
        assignmentStats.totalMarks * 0.3 + 
        (attendanceStats.present / attendanceStats.total || 0) * 100 * 0.2)
      ).toFixed(2),
    };
  }

  async generateCourseReport(courseId: string): Promise<any> {
    const testRepo = getRepository(Test);
    const attemptRepo = getRepository(Attempt);
    
    const tests = await testRepo.find({ where: { courseId } });
    
    let totalStudents = 0;
    let overallPassRate = 0;
    
    for (const test of tests) {
      const attempts = await attemptRepo.find({ where: { testId: test.id } });
      totalStudents = Math.max(totalStudents, attempts.length);
      const passed = attempts.filter(a => a.isPassed).length;
      if (attempts.length > 0) {
        overallPassRate += (passed / attempts.length * 100);
      }
    }

    return {
      courseId,
      testsCount: tests.length,
      studentsCount: totalStudents,
      averagePassRate: tests.length > 0 ? (overallPassRate / tests.length).toFixed(2) : '0',
    };
  }

  async exportToExcel(data: any[], columns: string[], title: string): Promise<Buffer> {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title);

    worksheet.columns = columns.map(col => ({ header: col, key: col, width: 15 }));

    for (const row of data) {
      worksheet.addRow(row);
    }

    return workbook.xlsx.writeBuffer() as unknown as Buffer;
  }

  async generatePDF(data: any, title: string): Promise<Buffer> {
    return Buffer.from('PDF content');
  }

  private async getQuestionnaireData(test: Test): Promise<any> {
    const questionnaireRepo = getRepository(Questionnaire);
    const responseRepo = getRepository(QuestionnaireResponse);
    const fieldRepo = getRepository(QuestionnaireField);

    let questionnaire = null;
    let fields: any[] = [];
    let responses: any[] = [];

    if (test.questionnaireId) {
      questionnaire = await questionnaireRepo.findOne({ where: { id: test.questionnaireId } });
      if (questionnaire) {
        fields = await fieldRepo.find({ where: { questionnaireId: test.questionnaireId }, order: { order: 'ASC' } });
      }
    }

    if (test.questionnaireSettings && !test.questionnaireId) {
      try {
        const parsed = JSON.parse(test.questionnaireSettings);
        fields = parsed.responseFields || [];
      } catch (e) {}
    }

    const allResponses = await responseRepo.find({ where: { testId: test.id } });

    const responsesByStudent: Record<string, any[]> = {};
    for (const r of allResponses) {
      if (!responsesByStudent[r.studentId]) {
        responsesByStudent[r.studentId] = [];
      }
      const field = fields.find(f => f.id === r.fieldId);
      responsesByStudent[r.studentId].push({
        fieldId: r.fieldId,
        fieldLabel: field?.label || '',
        response: r.responseText || r.responseNumber,
        submittedAt: r.createdAt,
      });
    }

    return {
      hasQuestionnaire: !!questionnaire || fields.length > 0,
      questionnaireId: test.questionnaireId,
      questionnaireName: questionnaire?.name || 'Custom Questionnaire',
      fields: fields.map(f => ({
        id: f.id,
        label: f.label,
        type: f.type,
        mandatory: f.mandatory,
      })),
      responsesByStudent,
      totalResponses: Object.keys(responsesByStudent).length,
    };
  }
}