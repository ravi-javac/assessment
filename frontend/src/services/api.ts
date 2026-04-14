import axios, { AxiosError } from 'axios';
import type { AuthResponse, ApiResponse } from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
  }) => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  requestOtp: async (email: string) => {
    const response = await api.post<ApiResponse>('/auth/otp/request', { email });
    return response.data;
  },

  verifyOtp: async (data: { email: string; otp: string }) => {
    const response = await api.post<AuthResponse>('/auth/otp/verify', data);
    return response.data;
  },

  resetPassword: async (data: { email: string; otp: string; newPassword: string }) => {
    const response = await api.post<ApiResponse>('/auth/password/reset', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post<ApiResponse>('/auth/logout');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get<ApiResponse>('/auth/profile');
    return response.data;
  },
};

export default api;