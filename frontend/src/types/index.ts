export type UserRole = 'admin' | 'faculty' | 'student';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  institutionId?: string;
  departmentId?: string;
  batchId?: string;
  assignedBatches?: any[];
  profileImage?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    token: string;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}