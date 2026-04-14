import { Router } from 'express';
import { ReportService } from '../modules/report/report.service';
import { notificationService } from '../modules/report/notification.service';

const reportService = new ReportService();

const router = Router();

router.get('/test/:testId', async (req, res) => {
  try {
    const report = await reportService.generateTestReport({
      testId: req.params.testId,
      includeProctoring: req.query.proctoring === 'true',
      includeQuestions: req.query.questions === 'true',
    });
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/student/:userId', async (req, res) => {
  try {
    const report = await reportService.generateStudentReport({
      userId: req.params.userId,
      courseId: req.query.courseId as string,
    });
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/course/:courseId', async (req, res) => {
  try {
    const report = await reportService.generateCourseReport(req.params.courseId);
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/email', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;
    const success = await notificationService.sendEmail({ to, subject, html, text });
    res.json({ success, message: success ? 'Email sent' : 'Failed to send' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/bulk-email', async (req, res) => {
  try {
    const { emails } = req.body;
    const count = await notificationService.sendBulkEmails(emails);
    res.json({ success: true, message: `${count} emails sent` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;