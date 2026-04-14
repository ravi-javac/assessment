import 'reflect-metadata';
import './utils/patch-typeorm';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { config } from './config/env';
import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';
import { logger } from './config/logger';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  try {
    await initializeDatabase();
    await initializeRedis();

    const { default: authRoutes } = await import('./routes/auth.routes');
    const { default: userRoutes } = await import('./routes/user.routes');
    const { default: questionRoutes } = await import('./routes/question.routes');
    const { default: assessmentRoutes } = await import('./routes/assessment.routes');
    const { default: examRoutes } = await import('./routes/exam.routes');
    const { default: proctoringRoutes } = await import('./routes/proctoring.routes');
    const { default: monitoringRoutes } = await import('./routes/monitoring.routes');
    const { default: attendanceRoutes } = await import('./routes/attendance.routes');
    const { default: assignmentRoutes } = await import('./routes/assignment.routes');
    const { default: reportRoutes } = await import('./routes/report.routes');
    const { default: questionnaireRoutes } = await import('./routes/questionnaire.routes');

    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/questions', questionRoutes);
    app.use('/api/assessments', assessmentRoutes);
    app.use('/api/exam', examRoutes);
    app.use('/api/proctoring', proctoringRoutes);
    app.use('/api/monitoring', monitoringRoutes);
    app.use('/api/attendance', attendanceRoutes);
    app.use('/api/assignments', assignmentRoutes);
    app.use('/api/reports', reportRoutes);
    app.use('/api/questionnaires', questionnaireRoutes);

    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error(err.stack);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    });

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;