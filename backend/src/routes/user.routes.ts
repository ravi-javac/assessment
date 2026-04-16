import { Router } from 'express';
import { User, UserRole } from '../modules/user/user.entity';
import { UserService } from '../modules/user/user.service';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { AppDataSource } from '../config/database';

const router = Router();

function getUserService() {
  const userRepository = AppDataSource.getRepository(User);
  return new UserService(userRepository);
}

router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const userService = getUserService();
    const { role, page = 1, limit = 10, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    
    const { data, total } = await userService.findAll(role as UserRole, skip, take, search as string);
    res.json({
      success: true,
      data: data,
      total: total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const userService = getUserService();
    const { email, password, firstName, lastName, phone, role, batchId } = req.body;
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ success: false, message: 'All fields are required' });
      return;
    }
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email already registered' });
      return;
    }
    const user = await userService.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: role as UserRole || UserRole.STUDENT,
      batchId,
    });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/stats', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const userService = getUserService();
    const { data: allUsers } = await userService.findAll(undefined, 0, 10000);
    const students = allUsers.filter(u => u.role === UserRole.STUDENT);
    const faculty = allUsers.filter(u => u.role === UserRole.FACULTY);
    const admins = allUsers.filter(u => u.role === UserRole.ADMIN);
    res.json({
      success: true,
      data: {
        total: allUsers.length,
        students: students.length,
        faculty: faculty.length,
        admins: admins.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userService = getUserService();
    const user = await userService.findOne(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userService = getUserService();
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;
    
    if (req.params.id !== userId && userRole !== 'admin') {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }
    
    const user = await userService.update(req.params.id, req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const userService = getUserService();
    await userService.delete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;