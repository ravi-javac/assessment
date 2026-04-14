export type SessionStatus = 'scheduled' | 'live' | 'paused' | 'completed' | 'cancelled';
export type ActivityType = 'start' | 'submit' | 'pause_resume' | 'violation' | 'warning';

export interface ExamSession {
  id: string;
  testId: string;
  test?: any;
  status: SessionStatus;
  startedAt: string;
  endedAt: string;
  totalRegistered: number;
  totalStarted: number;
  totalSubmitted: number;
  totalEvaluated: number;
  settings?: any;
}

export interface LiveExamActivity {
  id: string;
  attemptId: string;
  examSessionId: string;
  activityType: ActivityType;
  details: any;
  timestamp: string;
}

export interface SessionStats {
  started: number;
  submitted: number;
  inProgress: number;
  violations: number;
  warnings: number;
}

export interface LiveStudent {
  attemptId: string;
  currentQuestion: number;
  lastActivity: string;
  suspicionScore?: number;
}

export interface ExamAnnouncement {
  id: string;
  examSessionId: string;
  title: string;
  message: string;
  isGlobal: boolean;
  isSent: boolean;
  sentAt: string;
  createdAt: string;
}