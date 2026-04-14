import { Router } from 'express';
import { AuthController } from '../modules/auth/auth.controller';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.post('/otp/request', (req, res) => authController.requestOtp(req, res));
router.post('/otp/verify', (req, res) => authController.verifyOtp(req, res));
router.post('/password/reset', (req, res) => authController.resetPassword(req, res));
router.post('/logout', authMiddleware, (req, res) => authController.logout(req, res));
router.get('/profile', authMiddleware, (req, res) => authController.getProfile(req, res));

export default router;