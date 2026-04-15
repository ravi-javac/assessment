import api from './api';
import type { Assignment, AssignmentSubmission, AssignmentReport } from '@/types/assignment';

export const assignmentApi = {
  create: async (data: Partial<Assignment>) => {
    const response = await api.post('/assignments', data);
    return response.data;
  },

  getAll: async (filter?: { courseId?: string; status?: string }) => {
    const response = await api.get('/assignments', { params: filter });
    return response.data;
  },

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/assignments/upload-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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

  delete: async (id: string) => {
    const response = await api.delete(`/assignments/${id}`);
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

  approve: async (id: string) => {
    const response = await api.post(`/assignments/${id}/approve`);
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

  assignToEmails: async (id: string, emails: string[]) => {
    const response = await api.post(`/assignments/${id}/assign-emails`, { emails });
    return response.data;
  },

  assignToBatch: async (id: string, batchId: string) => {
    const response = await api.post(`/assignments/${id}/assign-batch`, { batchId });
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