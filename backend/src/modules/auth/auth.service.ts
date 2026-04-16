import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import otpGenerator from 'otp-generator';
import { config } from '../../config/env';
import { redis } from '../../config/redis';
import { User, UserStatus } from '../user/user.entity';
import { AppDataSource } from '../../config/database';

const JWT_BLACKLIST_PREFIX = 'jwt:blacklist:';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  async generateToken(user: User): Promise<string> {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    
    return jwt.sign(payload, config.jwt.secret as string, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    return jwt.verify(token, config.jwt.secret as string) as TokenPayload;
  }

  async invalidateToken(token: string): Promise<void> {
    const decoded = jwt.decode(token) as jwt.JwtPayload | null;
    if (decoded && decoded.exp) {
      const exp = decoded.exp;
      const ttl = exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await redis.setex(`${JWT_BLACKLIST_PREFIX}${token}`, ttl, '1');
      }
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await redis.get(`${JWT_BLACKLIST_PREFIX}${token}`);
    return blacklisted === '1';
  }

  async generateOtp(): Promise<string> {
    return otpGenerator.generate(6, {
      digits: true,
      lowerCase: false,
      upperCase: false,
      specialChars: false,
    });
  }

  async storeOtp(userId: string, otp: string): Promise<void> {
    const key = `otp:${userId}`;
    await redis.setex(key, config.otp.expiresIn * 60, otp);
  }

  async getStoredOtp(userId: string): Promise<string | null> {
    const key = `otp:${userId}`;
    return redis.get(key);
  }

  async verifyOtp(userId: string, otp: string): Promise<boolean> {
    const storedOtp = await this.getStoredOtp(userId);
    return storedOtp === otp;
  }

  async clearOtp(userId: string): Promise<void> {
    const key = `otp:${userId}`;
    await redis.del(key);
  }

  async validateUserCredentials(email: string, password: string): Promise<User | null> {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ 
      where: { email },
      relations: ['assignedBatches']
    });
    if (!user) {
      return null;
    }

    if (user.status !== UserStatus.ACTIVE) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    return user;
  }
}