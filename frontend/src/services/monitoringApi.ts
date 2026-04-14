import api from './api';
import type { ExamSession, LiveExamActivity, SessionStats, LiveStudent, ExamAnnouncement } from '@/types/monitoring';

export const monitoringApi = {
  createSession: async (data: { testId: string; settings?: any }) => {
    const response = await api.post('/monitoring/sessions', data);
    return response.data;
  },

  getSession: async (sessionId: string) => {
    const response = await api.get(`/monitoring/sessions/${sessionId}`);
    return response.data;
  },

  startSession: async (sessionId: string) => {
    const response = await api.post(`/monitoring/sessions/${sessionId}/start`);
    return response.data;
  },

  pauseSession: async (sessionId: string) => {
    const response = await api.post(`/monitoring/sessions/${sessionId}/pause`);
    return response.data;
  },

  resumeSession: async (sessionId: string) => {
    const response = await api.post(`/monitoring/sessions/${sessionId}/resume`);
    return response.data;
  },

  endSession: async (sessionId: string) => {
    const response = await api.post(`/monitoring/sessions/${sessionId}/end`);
    return response.data;
  },

  getActiveSessions: async () => {
    const response = await api.get('/monitoring/sessions/active');
    return response.data;
  },

  getActivities: async (sessionId: string, limit?: number) => {
    const response = await api.get(`/monitoring/sessions/${sessionId}/activities`, {
      params: { limit },
    });
    return response.data;
  },

  getSessionStats: async (sessionId: string) => {
    const response = await api.get(`/monitoring/sessions/${sessionId}/stats`);
    return response.data;
  },

  sendWarning: async (data: { attemptId: string; message: string }) => {
    const response = await api.post('/monitoring/warning', data);
    return response.data;
  },

  forceSubmit: async (attemptId: string) => {
    const response = await api.post(`/monitoring/attempt/${attemptId}/force-submit`);
    return response.data;
  },

  extendTime: async (data: { attemptId: string; minutes: number }) => {
    const response = await api.post('/monitoring/extend-time', data);
    return response.data;
  },

  createAnnouncement: async (data: { sessionId: string; title: string; message: string; isGlobal?: boolean }) => {
    const response = await api.post('/monitoring/announcements', data);
    return response.data;
  },

  getAnnouncements: async (sessionId: string) => {
    const response = await api.get(`/monitoring/sessions/${sessionId}/announcements`);
    return response.data;
  },
};