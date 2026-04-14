import { AppDataSource } from '../config/database';

const repositories = new Map<string, any>();

export function getRepository<T>(entityName: string): any {
  if (!repositories.has(entityName)) {
    const entityMap: Record<string, any> = {
      'User': require('../modules/user/user.entity').User,
      'Test': require('../modules/assessment/assessment.entity').Test,
      'Section': require('../modules/assessment/assessment.entity').Section,
      'TestQuestion': require('../modules/assessment/assessment.entity').TestQuestion,
      'Question': require('../modules/question/question.entity').Question,
      'Attempt': require('../modules/attempt/attempt.entity').Attempt,
      'Answer': require('../modules/attempt/attempt.entity').Answer,
      'ProctoringEvent': require('../modules/proctoring/proctoring.entity').ProctoringEvent,
      'ProctoringSnapshot': require('../modules/proctoring/proctoring.entity').ProctoringSnapshot,
      'SuspicionScore': require('../modules/proctoring/proctoring.entity').SuspicionScore,
      'Assignment': require('../modules/assignment/assignment.entity').Assignment,
      'AssignmentSubmission': require('../modules/assignment/assignment.entity').AssignmentSubmission,
      'AttendanceSession': require('../modules/attendance/attendance.entity').AttendanceSession,
      'AttendanceRecord': require('../modules/attendance/attendance.entity').AttendanceRecord,
      'ExamSession': require('../modules/monitoring/monitoring.entity').ExamSession,
      'LiveExamActivity': require('../modules/monitoring/monitoring.entity').LiveExamActivity,
      'ExamAnnouncement': require('../modules/monitoring/monitoring.entity').ExamAnnouncement,
    };
    
    const Entity = entityMap[entityName];
    if (Entity) {
      repositories.set(entityName, AppDataSource.getRepository(Entity));
    }
  }
  return repositories.get(entityName);
}

export function clearRepositories(): void {
  repositories.clear();
}