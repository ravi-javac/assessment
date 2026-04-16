import { UserRole } from '../user.entity';

export interface CreateUserDto {
  email: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  institutionId?: string;
  departmentId?: string;
  batchId?: string;
}

export interface UpdateUserDto {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  institutionId?: string;
  departmentId?: string;
  batchId?: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: string;
  institutionId: string | null;
  departmentId: string | null;
  profileImage: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastLogin: Date | null;
  createdAt: Date;
}