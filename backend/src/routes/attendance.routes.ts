import { Router } from 'express';
import { AttendanceController } from '../modules/attendance/attendance.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();
const attendanceController = new AttendanceController();

router.post('/sessions', authMiddleware, requireRole('admin', 'faculty'), (req, res) => attendanceController.createSession(req, res));
router.get('/sessions/active', authMiddleware, (req, res) => attendanceController.getActiveSessions(req, res));
router.get('/sessions/:sessionId', authMiddleware, (req, res) => attendanceController.getSession(req, res));
router.post('/sessions/:sessionId/start', authMiddleware, requireRole('admin', 'faculty'), (req, res) => attendanceController.startSession(req, res));
router.post('/sessions/:sessionId/end', authMiddleware, requireRole('admin', 'faculty'), (req, res) => attendanceController.endSession(req, res));
router.post('/sessions/:sessionId/lock', authMiddleware, requireRole('admin', 'faculty'), (req, res) => attendanceController.toggleLock(req, res));
router.get('/sessions/:sessionId/qrcode', authMiddleware, (req, res) => attendanceController.generateQRCode(req, res));
router.get('/sessions/:sessionId/records', authMiddleware, requireRole('admin', 'faculty'), (req, res) => attendanceController.getSessionRecords(req, res));
router.get('/sessions/:sessionId/report', authMiddleware, requireRole('admin', 'faculty'), (req, res) => attendanceController.getSessionReport(req, res));

router.post('/mark', authMiddleware, (req, res) => attendanceController.markAttendance(req, res));
router.post('/mark-manual', authMiddleware, requireRole('admin', 'faculty'), (req, res) => attendanceController.markManual(req, res));
router.post('/mark-batch', authMiddleware, requireRole('admin', 'faculty'), (req, res) => attendanceController.markBatch(req, res));
router.get('/batch/:batchId/history', authMiddleware, requireRole('admin', 'faculty'), (req, res) => attendanceController.getBatchHistory(req, res));
router.post('/bulk-import', authMiddleware, requireRole('admin', 'faculty'), (req, res) => attendanceController.bulkImportUsers(req, res));

export default router;