import { Question } from './question';

export type AssignmentStatus = 'draft' | 'published' | 'closed';
export type AssignmentType = 'mcq' | 'coding' | 'subjective' | 'file_upload' | 'mixed';

export interface ReadingMaterial {
  title: string;
  url: string;
  type: string;
}

export interface AssignmentQuestion {
  id: string;
  assignmentId: string;
  questionId: string;
  question?: Question;
  marks: number;
  order: number;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  type: AssignmentType;
  courseId?: string;
  semester?: string;
  batch?: string;
  section?: string;
  institutionId?: string;
  createdById?: string;
  status: AssignmentStatus;
  startDate?: string;
  dueDate?: string;
  durationMinutes?: number;
  totalMarks: number;
  maxAttempts: number;
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
  allowFileUpload: boolean;
  allowTextSubmission: boolean;
  maxFileSizeMB: number;
  allowedFileTypes?: string[];
  maxFiles: number;
  instructions?: string;
  readingMaterials?: ReadingMaterial[];
  questions?: AssignmentQuestion[];
  totalSubmissions: number;
  gradedSubmissions: number;
  createdAt: string;
}

export interface AttemptAnswer {
  id?: string;
  questionId: string;
  question?: Question;
  answer?: string;
  codingAnswer?: {
    code: string;
    language: string;
    results?: any;
  };
  mcqAnswer?: {
    selectedOption: string;
    isCorrect: boolean;
  };
  marksObtained?: number;
  feedback?: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  assignment?: Assignment;
  studentId: string;
  student?: any;
  textContent?: string;
  files?: { name: string; url: string; size: number }[];
  isLate: boolean;
  attemptNumber: number;
  marksObtained?: number;
  feedback?: string;
  gradedById?: string;
  gradedAt?: string;
  status: 'submitted' | 'graded' | 'returned' | 'in_progress' | 'not_submitted';
  answers?: AttemptAnswer[];
  submittedAt: string;
}

export interface AssignmentReport {
  assignment: Assignment;
  summary: {
    total: number;
    graded: number;
    pending: number;
    averageMarks: string;
  };
  submissions: AssignmentSubmission[];
}