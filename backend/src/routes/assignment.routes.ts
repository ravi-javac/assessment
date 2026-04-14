import { Router } from 'express';
import { AssignmentController } from '../modules/assignment/assignment.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();
const controller = new AssignmentController();

router.post('/', authMiddleware, requireRole('admin', 'faculty'), (req, res) => controller.create(req, res));
router.get('/course/:courseId', authMiddleware, (req, res) => controller.getByCourse(req, res));
router.get('/:id', authMiddleware, (req, res) => controller.get(req, res));
router.put('/:id', authMiddleware, requireRole('admin', 'faculty'), (req, res) => controller.update(req, res));
router.post('/:id/publish', authMiddleware, requireRole('admin', 'faculty'), (req, res) => controller.publish(req, res));
router.post('/:id/close', authMiddleware, requireRole('admin', 'faculty'), (req, res) => controller.close(req, res));
router.get('/:id/submissions', authMiddleware, requireRole('admin', 'faculty'), (req, res) => controller.getSubmissions(req, res));
router.get('/:id/report', authMiddleware, requireRole('admin', 'faculty'), (req, res) => controller.getReport(req, res));

router.post('/submit', authMiddleware, (req, res) => controller.submit(req, res));
router.get('/submissions/:submissionId/grade', authMiddleware, requireRole('admin', 'faculty'), (req, res) => controller.grade(req, res));
router.post('/submissions/:submissionId/return', authMiddleware, requireRole('admin', 'faculty'), (req, res) => controller.returnSubmission(req, res));
router.get('/my-submissions', authMiddleware, (req, res) => controller.getMySubmissions(req, res));

export default router;