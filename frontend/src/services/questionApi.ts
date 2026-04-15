import api from './api';
import type { Question, QuestionFilter } from '@/types/question';

export const questionApi = {
  create: async (data: Partial<Question>) => {
    const response = await api.post('/questions', data);
    return response.data;
  },

  bulkCreate: async (questions: Partial<Question>[]) => {
    const response = await api.post('/questions/bulk', { questions });
    return response.data;
  },

  getAll: async (filter?: QuestionFilter & { page?: number; limit?: number }) => {
    const response = await api.get('/questions', { params: filter });
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await api.get(`/questions/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<Question>) => {
    const response = await api.put(`/questions/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/questions/${id}`);
    return response.data;
  },

  activate: async (id: string) => {
    const response = await api.post(`/questions/${id}/activate`);
    return response.data;
  },

  archive: async (id: string) => {
    const response = await api.post(`/questions/${id}/archive`);
    return response.data;
  },

  getRandom: async (filter: Partial<QuestionFilter>, count: number) => {
    const response = await api.get('/questions/random', {
      params: { ...filter, count },
    });
    return response.data;
  },

  uploadBulk: async (file: File, defaultMarks: number = 1) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('defaultMarks', String(defaultMarks));

    const response = await api.post('/questions/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  downloadTemplate: async () => {
    const response = await api.get('/questions/template', { responseType: 'blob' });
    return response.data;
  },
};