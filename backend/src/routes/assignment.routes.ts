import { Router } from 'express';
import { AssignmentController } from '../modules/assignment/assignment.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();
const controller = new AssignmentController();
const upload = (require('multer') as any)({ storage: (require('multer') as any).memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', authMiddleware, requireRole('admin', 'faculty'), (req, res) => controller.create(req, res));
router.get('/', authMiddleware, (req, res) => controller.getAll(req, res));
router.post('/upload-file', authMiddleware, requireRole('admin', 'faculty'), upload.single('file'), (req, res) => controller.uploadFile(req, res));
router.get('/course/:courseId', authMiddleware, (req, res) => controller.getByCourse(req, res));
router.get('/my-submissions', authMiddleware, (req, res) => controller.getMySubmissions(req, res));
router.get('/:id', authMiddleware, (req, res) => controller.get(req, res));
router.put('/:id', authMiddleware, requireRole('admin', 'faculty', 'student'), (req, res) => controller.update(req, res));
router.delete('/:id', authMiddleware, requireRole('admin', 'faculty'), (req, res) => controller.delete(req, res));
router.post('/:id/publish', authMiddleware, requireRole('admin', 'faculty'), (req, res) => controller.publish(req, res));
router.post('/:id/close', authMiddleware, requireRole('admin', 'faculty'), (req, res) => controller.close(req, res));
router.post('/:id/approve', authMiddleware, requireRole('admin'), (req, res) => controller.approve(req, res));
router.get('/:id/submissions', authMiddleware, requireRole('admin', 'faculty'), (req, res) => controller.getSubmissions(req, res));
router.get('/:id/report', authMiddleware, requireRole('admin', 'faculty'), (req, res) => controller.getReport(req, res));
router.post('/:id/assign-emails', authMiddleware, requireRole('admin', 'faculty'), (req, res) => controller.assignToEmails(req, res));
router.post('/:id/assign-batch', authMiddleware, requireRole('admin', 'faculty'), (req, res) => controller.assignToBatch(req, res));

router.post('/submit', authMiddleware, (req, res) => controller.submit(req, res));
router.post('/submissions/:submissionId/grade', authMiddleware, requireRole('admin', 'faculty'), (req, res) => controller.grade(req, res));
router.post('/submissions/:submissionId/return', authMiddleware, requireRole('admin', 'faculty'), (req, res) => controller.returnSubmission(req, res));

export default router;