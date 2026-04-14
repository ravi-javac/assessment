import { Router } from 'express';
import { ExamController } from '../modules/exam/exam.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const examController = new ExamController();

router.post('/start', authMiddleware, (req, res) => examController.startExam(req, res));
router.get('/test/:testId', authMiddleware, (req, res) => examController.getTestQuestions(req, res));
router.post('/answer', authMiddleware, (req, res) => examController.saveAnswer(req, res));
router.post('/:attemptId/submit', authMiddleware, (req, res) => examController.submitExam(req, res));
router.get('/:attemptId', authMiddleware, (req, res) => examController.getAttempt(req, res));
router.get('/:attemptId/results', authMiddleware, (req, res) => examController.getResults(req, res));
router.post('/validate-device', authMiddleware, (req, res) => examController.validateDevice(req, res));

export default router;