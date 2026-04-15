import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from './user.entity';
import { CreateUserDto } from './interfaces/create-user.dto';

export class UserService {
  constructor(private userRepository: Repository<User>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    });
    
    return this.userRepository.save(user);
  }

  async findAll(role?: UserRole, skip: number = 0, take: number = 10, search?: string): Promise<{ data: User[], total: number }> {
    const query = this.userRepository.createQueryBuilder('user');
    
    if (role) {
      query.andWhere('user.role = :role', { role });
    }
    
    if (search) {
      query.andWhere('(user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search)', {
        search: `%${search}%`
      });
    }
    
    const [data, total] = await query
      .skip(skip)
      .take(take)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();
      
    return { data, total };
  }

  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phone } });
  }

  async update(id: string, updateData: Partial<User>): Promise<User | null> {
    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(id, { password: hashedPassword });
  }

  async setOtp(id: string, otp: string, otpExpires: Date): Promise<void> {
    await this.userRepository.update(id, { otp, otpExpires });
  }

  async verifyOtp(id: string, otp: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user || user.otp !== otp) {
      return false;
    }
    
    if (user.otpExpires && new Date() > user.otpExpires) {
      return false;
    }
    
    return true;
  }

  async clearOtp(id: string): Promise<void> {
    await this.userRepository.update(id, { otp: null, otpExpires: null });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLogin: new Date() });
  }

  async verifyEmail(id: string): Promise<void> {
    await this.userRepository.update(id, { isEmailVerified: true });
  }

  async verifyPhone(id: string): Promise<void> {
    await this.userRepository.update(id, { isPhoneVerified: true });
  }
}