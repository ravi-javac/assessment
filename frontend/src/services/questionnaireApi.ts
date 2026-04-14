import api from './api';
import type { Questionnaire, QuestionnaireFilter, QuestionnaireField } from '../types/questionnaire';

export const questionnaireApi = {
  getAll: async (filter?: QuestionnaireFilter) => {
    const response = await api.get('/questionnaires', { params: filter });
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await api.get(`/questionnaires/${id}`);
    return response.data;
  },

  create: async (data: Partial<Questionnaire>) => {
    const response = await api.post('/questionnaires', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Questionnaire>) => {
    const response = await api.put(`/questionnaires/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/questionnaires/${id}`);
    return response.data;
  },

  addField: async (questionnaireId: string, field: Partial<QuestionnaireField>) => {
    const response = await api.post(`/questionnaires/${questionnaireId}/fields`, field);
    return response.data;
  },

  updateField: async (questionnaireId: string, fieldId: string, field: Partial<QuestionnaireField>) => {
    const response = await api.put(`/questionnaires/${questionnaireId}/fields/${fieldId}`, field);
    return response.data;
  },

  deleteField: async (questionnaireId: string, fieldId: string) => {
    const response = await api.delete(`/questionnaires/${questionnaireId}/fields/${fieldId}`);
    return response.data;
  },

  saveResponses: async (testId: string, studentId: string, questionnaireId: string, responses: Array<{ fieldId: string; response: string | number }>) => {
    const response = await api.post(`/questionnaires/${questionnaireId}/responses`, {
      testId,
      studentId,
      questionnaireId,
      responses,
    });
    return response.data;
  },

  getResponses: async (testId: string) => {
    const response = await api.get(`/questionnaires/${testId}/responses`);
    return response.data;
  },

  getStudentResponses: async (testId: string, studentId: string) => {
    const response = await api.get(`/questionnaires/${testId}/responses/student/${studentId}`);
    return response.data;
  },
};