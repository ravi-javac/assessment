import { Router } from 'express';
import { BatchController } from '../modules/user/batch.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import multer from 'multer';

const router = Router();
const controller = new BatchController();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authMiddleware, requireRole('admin', 'faculty'), (req, res) => controller.getAll(req, res));
router.get('/:id', authMiddleware, requireRole('admin', 'faculty'), (req, res) => controller.getOne(req, res));
router.post('/', authMiddleware, requireRole('admin'), (req, res) => controller.create(req, res));
router.put('/:id', authMiddleware, requireRole('admin'), (req, res) => controller.update(req, res));
router.delete('/:id', authMiddleware, requireRole('admin'), (req, res) => controller.delete(req, res));

router.post('/:id/assign-faculty', authMiddleware, requireRole('admin'), (req, res) => controller.assignFaculty(req, res));
router.post('/preview-excel', authMiddleware, requireRole('admin', 'faculty'), upload.single('file'), (req, res) => controller.previewExcel(req, res));
router.post('/:id/bulk-students', authMiddleware, requireRole('admin', 'faculty'), (req, res) => controller.bulkAddStudents(req, res));

export default router;
