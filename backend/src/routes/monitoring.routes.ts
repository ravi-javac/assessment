import { Router } from 'express';
import { MonitoringController } from '../modules/monitoring/monitoring.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();
const monitoringController = new MonitoringController();

router.post('/sessions', authMiddleware, requireRole('admin', 'faculty'), (req, res) => monitoringController.createSession(req, res));
router.get('/sessions/active', authMiddleware, requireRole('admin', 'faculty'), (req, res) => monitoringController.getActiveSessions(req, res));
router.get('/sessions/:sessionId', authMiddleware, requireRole('admin', 'faculty'), (req, res) => monitoringController.getSession(req, res));
router.post('/sessions/:sessionId/start', authMiddleware, requireRole('admin', 'faculty'), (req, res) => monitoringController.startSession(req, res));
router.post('/sessions/:sessionId/pause', authMiddleware, requireRole('admin', 'faculty'), (req, res) => monitoringController.pauseSession(req, res));
router.post('/sessions/:sessionId/resume', authMiddleware, requireRole('admin', 'faculty'), (req, res) => monitoringController.resumeSession(req, res));
router.post('/sessions/:sessionId/end', authMiddleware, requireRole('admin', 'faculty'), (req, res) => monitoringController.endSession(req, res));

router.get('/sessions/:sessionId/activities', authMiddleware, requireRole('admin', 'faculty'), (req, res) => monitoringController.getActivities(req, res));
router.get('/sessions/:sessionId/stats', authMiddleware, requireRole('admin', 'faculty'), (req, res) => monitoringController.getSessionStats(req, res));
router.get('/sessions/:sessionId/announcements', authMiddleware, requireRole('admin', 'faculty'), (req, res) => monitoringController.getAnnouncements(req, res));
router.post('/announcements', authMiddleware, requireRole('admin', 'faculty'), (req, res) => monitoringController.createAnnouncement(req, res));

router.post('/warning', authMiddleware, requireRole('admin', 'faculty'), (req, res) => monitoringController.sendWarning(req, res));
router.post('/attempt/:attemptId/force-submit', authMiddleware, requireRole('admin', 'faculty'), (req, res) => monitoringController.forceSubmit(req, res));
router.post('/extend-time', authMiddleware, requireRole('admin', 'faculty'), (req, res) => monitoringController.extendTime(req, res));

export default router;