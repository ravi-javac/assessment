export type TestStatus = 'draft' | 'published' | 'live' | 'paused' | 'completed';
export type TestVisibility = 'private' | 'public';
export type ProctoringLevel = 'none' | 'basic' | 'strict';

export interface TestRules {
  duration: number;
  shuffledQuestions: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;
  allowPause: boolean;
  allowFlag: boolean;
  showInstantResults: boolean;
  breakTime: number;
  allowCalculator: boolean;
  allowNotes: boolean;
}

export interface RuleSettings extends TestRules {
  shuffledOptions: boolean;
  randomCutoff: boolean;
  cutoffMarks: number;
  passingMarks: number;
}

export interface InheritedRuleSettings extends RuleSettings {
  _inheritedFrom?: 'test' | 'section' | 'subsection';
  _overridden?: boolean;
}

export interface Test {
  id: string;
  title: string;
  description?: string;
  status: TestStatus;
  visibility: TestVisibility;
  accessCode?: string;
  duration: number;
  shuffledQuestions: boolean;
  shuffledOptions: boolean;
  passingMarks: number;
  proctoringLevel: ProctoringLevel;
  restrictDevices: boolean;
  restrictIP: boolean;
  allowedIPs?: string;
  showResults: boolean;
  showCorrectAnswers: boolean;
  allowPause: boolean;
  allowFlag: boolean;
  showInstantResults: boolean;
  breakTime: number;
  allowCalculator: boolean;
  allowNotes: boolean;
  resultMessage?: string;
  instructions?: string;
  startDate?: string;
  endDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  isQuestionnaire?: boolean;
  questionnaireId?: string;
  sendResultEmail?: boolean;
  maxAttempts: number;
  totalMarks: number;
  institutionId?: string;
  courseId?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  sections?: Section[];
}

export interface Section {
  id: string;
  name: string;
  description?: string;
  order: number;
  duration: number;
  marks: number;
  shuffledQuestions: boolean;
  showResults: boolean;
  testId: string;
  sectionDuration?: number;
  sectionShowResults?: boolean;
  sectionShuffledQuestions?: boolean;
  sectionAllowPause?: boolean;
  sectionAllowFlag?: boolean;
  sectionShowInstantResults?: boolean;
  sectionBreakTime?: number;
  sectionAllowCalculator?: boolean;
  sectionAllowNotes?: boolean;
  sectionShowCorrectAnswers?: boolean;
  sectionQuestionDuration?: number;
  sectionQuestionShowResults?: boolean;
  sectionQuestionShowCorrectAnswers?: boolean;
  sectionQuestionAllowFlag?: boolean;
  sectionQuestionDefaultMarks?: number;
  questionPoolEnabled?: boolean;
  poolSize?: number;
  poolRandomSelection?: boolean;
  poolPullMarks?: number;
  poolPullDuration?: number;
  subsections?: Subsection[];
  createdAt: string;
}

export interface Subsection {
  id: string;
  name: string;
  description?: string;
  order: number;
  duration: number;
  marks: number;
  shuffledQuestions: boolean;
  showResults: boolean;
  randomCutoff: boolean;
  cutoffMarks: number;
  sectionId: string;
  subsectionDuration?: number;
  subsectionShowResults?: boolean;
  subsectionShuffledQuestions?: boolean;
  subsectionAllowPause?: boolean;
  subsectionAllowFlag?: boolean;
  subsectionShowInstantResults?: boolean;
  subsectionBreakTime?: number;
  subsectionAllowCalculator?: boolean;
  subsectionAllowNotes?: boolean;
  subsectionShowCorrectAnswers?: boolean;
  subsectionQuestionDuration?: number;
  subsectionQuestionShowResults?: boolean;
  subsectionQuestionShowCorrectAnswers?: boolean;
  subsectionQuestionAllowFlag?: boolean;
  subsectionQuestionDefaultMarks?: number;
  questionPoolEnabled?: boolean;
  poolSize?: number;
  poolRandomSelection?: boolean;
  poolPullMarks?: number;
  poolPullDuration?: number;
  createdAt: string;
}

export interface TestQuestion {
  id: string;
  order: number;
  marks: number;
  sectionId?: string;
  subsectionId?: string;
  questionId?: string;
  question?: Question;
  questionDuration?: number;
  questionShowResults?: boolean;
  questionShowCorrectAnswers?: boolean;
  questionAllowFlag?: boolean;
  questionMarks?: number;
}

export interface QuestionRules {
  duration: number | null;
  showResults: boolean;
  showCorrectAnswers: boolean;
  allowFlag: boolean;
  marks: number;
}

export interface Question {
  id: string;
  title: string;
  type: string;
  marks?: number;
}

export interface TestFilter {
  status?: TestStatus;
  visibility?: TestVisibility;
  search?: string;
  institutionId?: string;
  courseId?: string;
}

export interface CreateTestDto {
  title: string;
  description?: string;
  visibility?: TestVisibility;
  accessCode?: string;
  duration?: number;
  shuffledQuestions?: boolean;
  shuffledOptions?: boolean;
  passingMarks?: number;
  proctoringLevel?: ProctoringLevel;
  restrictDevices?: boolean;
  restrictIP?: boolean;
  allowedIPs?: string;
  showResults?: boolean;
  showCorrectAnswers?: boolean;
  allowPause?: boolean;
  allowFlag?: boolean;
  showInstantResults?: boolean;
  breakTime?: number;
  allowCalculator?: boolean;
  allowNotes?: boolean;
  resultMessage?: string;
  instructions?: string;
  startDate?: Date;
  endDate?: Date;
  maxAttempts?: number;
  totalMarks?: number;
  institutionId?: string;
  courseId?: string;
}

export interface CreateSectionDto {
  name: string;
  description?: string;
  order?: number;
  duration?: number;
  marks?: number;
  shuffledQuestions?: boolean;
  showResults?: boolean;
  sectionDuration?: number;
  sectionShowResults?: boolean;
  sectionShuffledQuestions?: boolean;
  sectionAllowPause?: boolean;
  sectionAllowFlag?: boolean;
  sectionShowInstantResults?: boolean;
  sectionBreakTime?: number;
  sectionAllowCalculator?: boolean;
  sectionAllowNotes?: boolean;
  sectionShowCorrectAnswers?: boolean;
  sectionQuestionDuration?: number;
  sectionQuestionShowResults?: boolean;
  sectionQuestionShowCorrectAnswers?: boolean;
  sectionQuestionAllowFlag?: boolean;
  sectionQuestionDefaultMarks?: number;
  testId: string;
}

export interface CreateSubsectionDto {
  name: string;
  description?: string;
  order?: number;
  duration?: number;
  marks?: number;
  shuffledQuestions?: boolean;
  showResults?: boolean;
  randomCutoff?: boolean;
  cutoffMarks?: number;
  subsectionDuration?: number;
  subsectionShowResults?: boolean;
  subsectionShuffledQuestions?: boolean;
  subsectionAllowPause?: boolean;
  subsectionAllowFlag?: boolean;
  subsectionShowInstantResults?: boolean;
  subsectionBreakTime?: number;
  subsectionAllowCalculator?: boolean;
  subsectionAllowNotes?: boolean;
  subsectionShowCorrectAnswers?: boolean;
  subsectionQuestionDuration?: number;
  subsectionQuestionShowResults?: boolean;
  subsectionQuestionShowCorrectAnswers?: boolean;
  subsectionQuestionAllowFlag?: boolean;
  subsectionQuestionDefaultMarks?: number;
  sectionId: string;
}
