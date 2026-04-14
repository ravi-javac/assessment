import { Router } from 'express';
import { ProctoringController } from '../modules/proctoring/proctoring.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const proctoringController = new ProctoringController();

router.post('/tab-event', authMiddleware, (req, res) => proctoringController.handleTabEvent(req, res));
router.post('/face-detection', authMiddleware, (req, res) => proctoringController.handleFaceDetection(req, res));
router.post('/movement', authMiddleware, (req, res) => proctoringController.handleMovement(req, res));
router.post('/screenshot', authMiddleware, (req, res) => proctoringController.saveScreenshot(req, res));
router.get('/:attemptId/events', authMiddleware, (req, res) => proctoringController.getEvents(req, res));
router.get('/:attemptId/snapshots', authMiddleware, (req, res) => proctoringController.getSnapshots(req, res));
router.get('/:attemptId/score', authMiddleware, (req, res) => proctoringController.getSuspicionScore(req, res));
router.post('/:attemptId/calculate-score', authMiddleware, (req, res) => proctoringController.calculateScore(req, res));

export default router;