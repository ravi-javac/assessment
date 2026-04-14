import api from './api';
import type { Assignment, AssignmentSubmission, AssignmentReport } from '@/types/assignment';

export const assignmentApi = {
  create: async (data: Partial<Assignment>) => {
    const response = await api.post('/assignments', data);
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },

  getByCourse: async (courseId: string) => {
    const response = await api.get(`/assignments/course/${courseId}`);
    return response.data;
  },

  update: async (id: string, data: Partial<Assignment>) => {
    const response = await api.put(`/assignments/${id}`, data);
    return response.data;
  },

  publish: async (id: string) => {
    const response = await api.post(`/assignments/${id}/publish`);
    return response.data;
  },

  close: async (id: string) => {
    const response = await api.post(`/assignments/${id}/close`);
    return response.data;
  },

  getSubmissions: async (id: string) => {
    const response = await api.get(`/assignments/${id}/submissions`);
    return response.data;
  },

  getReport: async (id: string) => {
    const response = await api.get(`/assignments/${id}/report`);
    return response.data;
  },

  submit: async (data: { assignmentId: string; textContent?: string; files?: any[] }) => {
    const response = await api.post('/assignments/submit', data);
    return response.data;
  },

  grade: async (submissionId: string, marksObtained: number, feedback: string) => {
    const response = await api.post(`/assignments/submissions/${submissionId}/grade`, { marksObtained, feedback });
    return response.data;
  },

  returnSubmission: async (submissionId: string) => {
    const response = await api.post(`/assignments/submissions/${submissionId}/return`);
    return response.data;
  },

  getMySubmissions: async () => {
    const response = await api.get('/assignments/my-submissions');
    return response.data;
  },
};