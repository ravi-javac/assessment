import type { Test } from './assessment';

export type AttemptStatus = 'started' | 'in_progress' | 'submitted' | 'auto_submitted' | 'evaluated';

export interface Attempt {
  id: string;
  userId: string;
  testId: string;
  test?: Test;
  status: AttemptStatus;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  isPassed: boolean;
  startedAt: string;
  submittedAt: string;
  timeTaken: number;
  ipAddress?: string;
  deviceInfo?: string;
  browserInfo?: string;
}

export interface ExamQuestion {
  id: string;
  questionId: string;
  title: string;
  content: string;
  type: 'mcq' | 'coding' | 'subjective';
  marks: number;
  options?: { key: string; value: string }[];
  codeTemplate?: string;
  language?: string;
  testCases?: { input: string; expectedOutput: string; isHidden: boolean }[];
}

export interface ExamTest {
  id: string;
  title: string;
  description?: string;
  duration: number;
  instructions?: string;
  showResults: boolean;
  showCorrectAnswers: boolean;
  shuffledQuestions: boolean;
  shuffledOptions: boolean;
  questions: ExamQuestion[];
}

export interface Answer {
  id: string;
  attemptId: string;
  questionId: string;
  sectionId?: string;
  userAnswer: string;
  marksObtained: number;
  isCorrect: boolean;
  feedback?: string;
  codeOutput?: string;
  isAutoSaved: boolean;
}