import api from './api';
import type { Test, Section, Subsection, TestFilter, TestRules, QuestionRules } from '@/types/assessment';

export const assessmentApi = {
  create: async (data: Partial<Test>) => {
    const response = await api.post('/assessments', data);
    return response.data;
  },

  getAll: async (filter?: TestFilter) => {
    const response = await api.get('/assessments', { params: filter });
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await api.get(`/assessments/${id}`);
    return response.data;
  },

  getWithSections: async (testId: string) => {
    const response = await api.get(`/assessments/${testId}/with-sections`);
    return response.data;
  },

  getTotals: async (testId: string) => {
    const response = await api.get(`/assessments/${testId}/totals`);
    return response.data;
  },

  update: async (id: string, data: Partial<Test>) => {
    const response = await api.put(`/assessments/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/assessments/${id}`);
    return response.data;
  },

  publish: async (id: string) => {
    const response = await api.post(`/assessments/${id}/publish`);
    return response.data;
  },

  goLive: async (id: string) => {
    const response = await api.post(`/assessments/${id}/go-live`);
    return response.data;
  },

  pause: async (id: string) => {
    const response = await api.post(`/assessments/${id}/pause`);
    return response.data;
  },

  generateAccessCode: async (id: string) => {
    const response = await api.post(`/assessments/${id}/access-code`);
    return response.data;
  },

  clone: async (id: string, newTitle: string) => {
    const response = await api.post(`/assessments/${id}/clone`, { newTitle });
    return response.data;
  },

  getTestRules: async (testId: string): Promise<TestRules> => {
    const response = await api.get(`/assessments/${testId}/rules`);
    return response.data.data;
  },

  getSectionRules: async (sectionId: string): Promise<TestRules> => {
    const response = await api.get(`/assessments/sections/${sectionId}/rules`);
    return response.data.data;
  },

  getSubsectionRules: async (subsectionId: string): Promise<TestRules> => {
    const response = await api.get(`/assessments/subsections/${subsectionId}/rules`);
    return response.data.data;
  },

  getSectionSettingsWithInheritance: async (sectionId: string) => {
    const response = await api.get(`/assessments/sections/${sectionId}/effective-settings`);
    return response.data;
  },

  getSubsectionSettingsWithInheritance: async (subsectionId: string) => {
    const response = await api.get(`/assessments/subsections/${subsectionId}/effective-settings`);
    return response.data;
  },

  getQuestionRules: async (testQuestionId: string): Promise<QuestionRules> => {
    const response = await api.get(`/assessments/questions/${testQuestionId}/rules`);
    return response.data.data;
  },

  createSection: async (data: Partial<Section>) => {
    const response = await api.post('/assessments/sections', data);
    return response.data;
  },

  getSections: async (testId: string) => {
    const response = await api.get(`/assessments/${testId}/sections`);
    return response.data;
  },

  updateSection: async (id: string, data: Partial<Section>) => {
    const response = await api.put(`/assessments/sections/${id}`, data);
    return response.data;
  },

  deleteSection: async (id: string) => {
    const response = await api.delete(`/assessments/sections/${id}`);
    return response.data;
  },

  createSubsection: async (data: Partial<Subsection>) => {
    const response = await api.post('/assessments/subsections', data);
    return response.data;
  },

  getSubsections: async (sectionId: string) => {
    const response = await api.get(`/assessments/sections/${sectionId}/subsections`);
    return response.data;
  },

  updateSubsection: async (id: string, data: Partial<Subsection>) => {
    const response = await api.put(`/assessments/subsections/${id}`, data);
    return response.data;
  },

  deleteSubsection: async (id: string) => {
    const response = await api.delete(`/assessments/subsections/${id}`);
    return response.data;
  },

  addQuestion: async (testId: string, data: { 
    questionId: string; 
    sectionId?: string; 
    subsectionId?: string; 
    marks?: number;
    order?: number;
    questionSettings?: {
      questionDuration?: number;
      questionShowResults?: boolean;
      questionShowCorrectAnswers?: boolean;
      questionAllowFlag?: boolean;
      questionMarks?: number;
    };
  }) => {
    const response = await api.post(`/assessments/${testId}/questions`, data);
    return response.data;
  },

  removeQuestion: async (testQuestionId: string) => {
    const response = await api.delete(`/assessments/questions/${testQuestionId}`);
    return response.data;
  },

  getTestQuestions: async (testId: string) => {
    const response = await api.get(`/assessments/${testId}/questions`);
    return response.data;
  },

  getScoreDistribution: async (testId: string) => {
    const response = await api.get(`/assessments/${testId}/analytics/scores`);
    return response.data;
  },

  getQuestionAnalytics: async (testId: string) => {
    const response = await api.get(`/assessments/${testId}/analytics/questions`);
    return response.data;
  },

  getStudentPerformance: async (testId: string, studentId: string) => {
    const response = await api.get(`/assessments/${testId}/analytics/student/${studentId}`);
    return response.data;
  },

  sendResultEmail: async (testId: string, studentId: string) => {
    const response = await api.post(`/assessments/${testId}/send-result`, { studentId });
    return response.data;
  },

  createInvitation: async (testId: string, email: string) => {
    const response = await api.post(`/assessments/${testId}/invite`, { email });
    return response.data;
  },
};