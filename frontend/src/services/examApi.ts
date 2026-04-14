import api from './api';
import type { ExamTest, Attempt, Answer } from '@/types/exam';

export const examApi = {
  start: async (data: { testId: string; ipAddress?: string; deviceInfo?: string; browserInfo?: string }) => {
    const response = await api.post('/exam/start', data);
    return response.data;
  },

  getTest: async (testId: string) => {
    const response = await api.get(`/exam/test/${testId}`);
    return response.data;
  },

  saveAnswer: async (data: { attemptId: string; questionId: string; sectionId?: string; userAnswer: string; isAutoSaved?: boolean }) => {
    const response = await api.post('/exam/answer', data);
    return response.data;
  },

  submit: async (attemptId: string) => {
    const response = await api.post(`/exam/${attemptId}/submit`);
    return response.data;
  },

  getAttempt: async (attemptId: string) => {
    const response = await api.get(`/exam/${attemptId}`);
    return response.data;
  },

  getResults: async (attemptId: string) => {
    const response = await api.get(`/exam/${attemptId}/results`);
    return response.data;
  },

  validateDevice: async (data: { testId: string; ipAddress?: string; deviceInfo?: string }) => {
    const response = await api.post('/exam/validate-device', data);
    return response.data;
  },
};