import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '../modules/auth/auth.service';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  userEmail?: string;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    const authService = new AuthService();
    const isBlacklisted = await authService.isTokenBlacklisted(token);
    
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        message: 'Token has been invalidated',
      });
      return;
    }

    const payload = await authService.verifyToken(token);
    req.userId = payload.userId;
    req.userRole = payload.role;
    req.userEmail = payload.email;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }
    next();
  };
};