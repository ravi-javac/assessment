import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { User, UserRole } from '../user/user.entity';
import { AppDataSource } from '../../config/database';

export class AuthController {
  private authService: AuthService;
  private userService: UserService;

  constructor() {
    const userRepository = AppDataSource.getRepository(User);
    this.userService = new UserService(userRepository);
    this.authService = new AuthService();
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, phone, role } = req.body;

      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          message: 'Email, password, firstName, and lastName are required',
        });
        return;
      }

      const existingUser = await this.userService.findByEmail(email);
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'Email already registered',
        });
        return;
      }

      const user = await this.userService.create({
        email,
        password,
        firstName,
        lastName,
        phone,
        role: role as UserRole || UserRole.STUDENT,
      });

      const token = await this.authService.generateToken(user);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
        return;
      }

      const user = await this.authService.validateUserCredentials(email, password);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
        return;
      }

      await this.userService.updateLastLogin(user.id);
      const token = await this.authService.generateToken(user);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            assignedBatches: user.assignedBatches,
            batch: user.batch,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async requestOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
        });
        return;
      }

      const user = await this.userService.findByEmail(email);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      const otp = await this.authService.generateOtp();
      await this.authService.storeOtp(user.id, otp);

      console.log(`OTP for ${email}: ${otp}`);

      res.json({
        success: true,
        message: 'OTP sent to your email',
      });
    } catch (error) {
      console.error('OTP request error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        res.status(400).json({
          success: false,
          message: 'Email and OTP are required',
        });
        return;
      }

      const user = await this.userService.findByEmail(email);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      const isValid = await this.authService.verifyOtp(user.id, otp);
      if (!isValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired OTP',
        });
        return;
      }

      await this.authService.clearOtp(user.id);
      const token = await this.authService.generateToken(user);

      res.json({
        success: true,
        message: 'OTP verified successfully',
        data: { token },
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Email, OTP, and newPassword are required',
        });
        return;
      }

      const user = await this.userService.findByEmail(email);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      const isValid = await this.authService.verifyOtp(user.id, otp);
      if (!isValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired OTP',
        });
        return;
      }

      await this.userService.updatePassword(user.id, newPassword);
      await this.authService.clearOtp(user.id);

      res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        await this.authService.invalidateToken(token);
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const user = await this.userService.findOne(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}