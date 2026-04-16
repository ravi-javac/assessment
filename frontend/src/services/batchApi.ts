import api from './api';

export interface Batch {
  id: string;
  name: string;
  description?: string;
  courseId?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  students?: any[];
  assignedFaculty?: any[];
  createdAt: string;
}

export const batchApi = {
  getAll: async () => {
    const response = await api.get('/batches');
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await api.get(`/batches/${id}`);
    return response.data;
  },

  create: async (data: Partial<Batch>) => {
    const response = await api.post('/batches', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Batch>) => {
    const response = await api.put(`/batches/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/batches/${id}`);
    return response.data;
  },

  assignFaculty: async (batchId: string, facultyIds: string[]) => {
    const response = await api.post(`/batches/${batchId}/assign-faculty`, { facultyIds });
    return response.data;
  },

  previewExcel: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/batches/preview-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  bulkAddStudents: async (batchId: string, students: any[]) => {
    const response = await api.post(`/batches/${batchId}/bulk-students`, { students });
    return response.data;
  }
};
