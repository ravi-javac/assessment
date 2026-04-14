import api from './api';
import type { AttendanceSession, AttendanceRecord, AttendanceReport } from '@/types/attendance';

export const attendanceApi = {
  createSession: async (data: Partial<AttendanceSession>) => {
    const response = await api.post('/attendance/sessions', data);
    return response.data;
  },

  getSession: async (sessionId: string) => {
    const response = await api.get(`/attendance/sessions/${sessionId}`);
    return response.data;
  },

  startSession: async (sessionId: string) => {
    const response = await api.post(`/attendance/sessions/${sessionId}/start`);
    return response.data;
  },

  endSession: async (sessionId: string) => {
    const response = await api.post(`/attendance/sessions/${sessionId}/end`);
    return response.data;
  },

  getQRCode: async (sessionId: string) => {
    const response = await api.get(`/attendance/sessions/${sessionId}/qrcode`);
    return response.data;
  },

  getActiveSessions: async () => {
    const response = await api.get('/attendance/sessions/active');
    return response.data;
  },

  getSessionRecords: async (sessionId: string) => {
    const response = await api.get(`/attendance/sessions/${sessionId}/records`);
    return response.data;
  },

  getSessionReport: async (sessionId: string) => {
    const response = await api.get(`/attendance/sessions/${sessionId}/report`);
    return response.data;
  },

  markAttendance: async (data: {
    sessionId: string;
    qrCode?: string;
    checkInMethod?: string;
    checkInIP?: string;
    checkInLatitude?: number;
    checkInLongitude?: number;
    checkInDevice?: string;
  }) => {
    const response = await api.post('/attendance/mark', data);
    return response.data;
  },

  markManual: async (data: {
    sessionId: string;
    targetUserId: string;
    status: string;
    remarks?: string;
  }) => {
    const response = await api.post('/attendance/mark-manual', data);
    return response.data;
  },

  bulkImport: async (sessionId: string, userIds: string[]) => {
    const response = await api.post('/attendance/bulk-import', { sessionId, userIds });
    return response.data;
  },
};