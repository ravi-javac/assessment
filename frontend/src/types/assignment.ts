export type AssignmentStatus = 'draft' | 'published' | 'closed';

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  courseId?: string;
  institutionId?: string;
  createdById?: string;
  status: AssignmentStatus;
  dueDate?: string;
  totalMarks: number;
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
  allowFileUpload: boolean;
  allowTextSubmission: boolean;
  maxFileSizeMB: number;
  allowedFileTypes?: string[];
  maxFiles: number;
  instructions?: string;
  totalSubmissions: number;
  gradedSubmissions: number;
  createdAt: string;
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
  marksObtained?: number;
  feedback?: string;
  gradedById?: string;
  gradedAt?: string;
  status: 'submitted' | 'graded' | 'returned';
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