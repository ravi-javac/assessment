import api from './api';

export const proctoringApi = {
  handleTabEvent: async (data: { 
    attemptId: string; 
    type: string; 
    timestamp: string 
  }) => {
    const response = await api.post('/proctoring/tab-event', data);
    return response.data;
  },

  handleFaceDetection: async (data: { 
    attemptId: string; 
    faceCount: number; 
    timestamp: string 
  }) => {
    const response = await api.post('/proctoring/face-detection', data);
    return response.data;
  },

  handleMovement: async (data: { 
    attemptId: string; 
    movementLevel: number; 
    timestamp: string 
  }) => {
    const response = await api.post('/proctoring/movement', data);
    return response.data;
  },

  saveScreenshot: async (data: { 
    attemptId: string; 
    imageData: string; 
    timestamp: string 
  }) => {
    const response = await api.post('/proctoring/screenshot', data);
    return response.data;
  },

  getEvents: async (attemptId: string) => {
    const response = await api.get(`/proctoring/${attemptId}/events`);
    return response.data;
  },

  getSnapshots: async (attemptId: string) => {
    const response = await api.get(`/proctoring/${attemptId}/snapshots`);
    return response.data;
  },

  getSuspicionScore: async (attemptId: string) => {
    const response = await api.get(`/proctoring/${attemptId}/score`);
    return response.data;
  },

  calculateScore: async (attemptId: string) => {
    const response = await api.post(`/proctoring/${attemptId}/calculate-score`);
    return response.data;
  },
};