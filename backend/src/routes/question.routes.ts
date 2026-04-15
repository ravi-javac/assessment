import { Router } from 'express';
import { QuestionController } from '../modules/question/question.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();
const questionController = new QuestionController();

const upload = (require('multer') as any)({ storage: (require('multer') as any).memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', authMiddleware, requireRole('admin', 'faculty'), (req, res) => questionController.create(req, res));
router.post('/bulk', authMiddleware, requireRole('admin', 'faculty'), (req, res) => questionController.bulkCreate(req, res));
router.get('/', authMiddleware, (req, res) => questionController.getAll(req, res));
router.get('/random', authMiddleware, (req, res) => questionController.getRandom(req, res));
router.get('/:id', authMiddleware, (req, res) => questionController.getOne(req, res));
router.put('/:id', authMiddleware, requireRole('admin', 'faculty'), (req, res) => questionController.update(req, res));
router.delete('/:id', authMiddleware, requireRole('admin', 'faculty'), (req, res) => questionController.delete(req, res));
router.post('/:id/activate', authMiddleware, requireRole('admin', 'faculty'), (req, res) => questionController.activate(req, res));
router.post('/:id/archive', authMiddleware, requireRole('admin', 'faculty'), (req, res) => questionController.archive(req, res));
router.post('/check-duplicate', authMiddleware, requireRole('admin', 'faculty'), (req, res) => questionController.checkDuplicate(req, res));
router.post('/bulk-upload', authMiddleware, requireRole('admin', 'faculty'), upload.single('file'), (req, res) => questionController.bulkUploadMCQ(req, res));

export default router;