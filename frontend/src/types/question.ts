export type QuestionType = 'mcq' | 'coding' | 'subjective' | 'sql';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionStatus = 'draft' | 'active' | 'archived';

export interface QuestionOption {
  key: string;
  value: string;
  isCorrect: boolean;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface Question {
  id: string;
  title: string;
  content: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  status: QuestionStatus;
  tags: string[];
  options?: QuestionOption[];
  correctAnswer?: string;
  correctAnswerExplanation?: string;
  codeTemplate?: string;
  language?: string;
  testCases?: TestCase[];
  marks: number;
  institutionId?: string;
  createdById?: string;
  attemptCount: number;
  successRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionFilter {
  type?: QuestionType;
  difficulty?: QuestionDifficulty;
  status?: QuestionStatus;
  tags?: string[];
  search?: string;
}