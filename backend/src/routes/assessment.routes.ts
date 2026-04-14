import { Router } from 'express';
import { AssessmentController } from '../modules/assessment/assessment.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();
const assessmentController = new AssessmentController();

router.post('/', authMiddleware, requireRole('admin', 'faculty'), (req, res) => assessmentController.createTest(req, res));
router.get('/', authMiddleware, (req, res) => assessmentController.getAllTests(req, res));
router.get('/:id', authMiddleware, (req, res) => assessmentController.getTest(req, res));
router.put('/:id', authMiddleware, requireRole('admin', 'faculty'), (req, res) => assessmentController.updateTest(req, res));
router.delete('/:id', authMiddleware, requireRole('admin', 'faculty'), (req, res) => assessmentController.deleteTest(req, res));
router.post('/:id/publish', authMiddleware, requireRole('admin', 'faculty'), (req, res) => assessmentController.publishTest(req, res));
router.post('/:id/go-live', authMiddleware, requireRole('admin', 'faculty'), (req, res) => assessmentController.goLive(req, res));
router.post('/:id/pause', authMiddleware, requireRole('admin', 'faculty'), (req, res) => assessmentController.pauseTest(req, res));
router.post('/:id/access-code', authMiddleware, requireRole('admin', 'faculty'), (req, res) => assessmentController.generateAccessCode(req, res));
router.post('/:id/clone', authMiddleware, requireRole('admin', 'faculty'), (req, res) => assessmentController.cloneTest(req, res));
router.get('/:testId/rules', authMiddleware, (req, res) => assessmentController.getTestRules(req, res));
router.get('/:testId/with-sections', authMiddleware, (req, res) => assessmentController.getTestWithSections(req, res));
router.get('/:testId/totals', authMiddleware, (req, res) => assessmentController.getTestTotals(req, res));

router.post('/sections', authMiddleware, requireRole('admin', 'faculty'), (req, res) => assessmentController.createSection(req, res));
router.get('/:testId/sections', authMiddleware, (req, res) => assessmentController.getSections(req, res));
router.put('/sections/:id', authMiddleware, requireRole('admin', 'faculty'), (req, res) => assessmentController.updateSection(req, res));
router.delete('/sections/:id', authMiddleware, requireRole('admin', 'faculty'), (req, res) => assessmentController.deleteSection(req, res));
router.get('/sections/:sectionId/rules', authMiddleware, (req, res) => assessmentController.getSectionRules(req, res));
router.get('/sections/:sectionId/effective-settings', authMiddleware, (req, res) => assessmentController.getSectionSettingsWithInheritance(req, res));

router.post('/subsections', authMiddleware, requireRole('admin', 'faculty'), (req, res) => assessmentController.createSubsection(req, res));
router.get('/sections/:sectionId/subsections', authMiddleware, (req, res) => assessmentController.getSubsections(req, res));
router.put('/subsections/:id', authMiddleware, requireRole('admin', 'faculty'), (req, res) => assessmentController.updateSubsection(req, res));
router.delete('/subsections/:id', authMiddleware, requireRole('admin', 'faculty'), (req, res) => assessmentController.deleteSubsection(req, res));
router.get('/subsections/:subsectionId/rules', authMiddleware, (req, res) => assessmentController.getSubsectionRules(req, res));
router.get('/subsections/:subsectionId/effective-settings', authMiddleware, (req, res) => assessmentController.getSubsectionSettingsWithInheritance(req, res));

router.get('/:testId/questions', authMiddleware, (req, res) => assessmentController.getTestQuestions(req, res));
router.post('/:testId/questions', authMiddleware, requireRole('admin', 'faculty'), (req, res) => assessmentController.addQuestion(req, res));
router.delete('/questions/:testQuestionId', authMiddleware, requireRole('admin', 'faculty'), (req, res) => assessmentController.removeQuestion(req, res));
router.get('/questions/:testQuestionId/rules', authMiddleware, (req, res) => assessmentController.getQuestionRules(req, res));

router.get('/:testId/analytics/scores', authMiddleware, requireRole('admin', 'faculty'), (req, res) => assessmentController.getScoreDistribution(req, res));
router.get('/:testId/analytics/questions', authMiddleware, requireRole('admin', 'faculty'), (req, res) => assessmentController.getQuestionAnalytics(req, res));
router.get('/:testId/analytics/student/:studentId', authMiddleware, (req, res) => assessmentController.getStudentPerformance(req, res));
router.post('/:testId/send-result', authMiddleware, requireRole('admin', 'faculty'), (req, res) => assessmentController.sendResultEmail(req, res));
router.post('/:testId/invite', authMiddleware, requireRole('admin', 'faculty'), (req, res) => assessmentController.createInvitation(req, res));

export default router;