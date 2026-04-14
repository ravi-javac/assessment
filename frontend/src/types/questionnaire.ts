export type QuestionnaireFieldType = 'text' | 'number' | 'email' | 'paragraph' | 'dob' | 'rating' | 'mcq';

export interface QuestionnaireField {
  id: string;
  type: QuestionnaireFieldType;
  label: string;
  mandatory: boolean;
  scale?: number;
  options?: string[];
  order: number;
}

export interface Questionnaire {
  id: string;
  name: string;
  fields: QuestionnaireField[];
  allowComments: boolean;
  createdAt: string;
  updatedAt: string;
  institutionId?: string;
  createdById?: string;
}

export interface QuestionnaireFilter {
  search?: string;
  institutionId?: string;
}