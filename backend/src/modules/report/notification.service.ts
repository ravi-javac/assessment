import { createTransport } from 'nodemailer';
import { config } from '../../config/env';
import { redis } from '../../config/redis';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

export interface SMSOptions {
  to: string;
  message: string;
}

export interface PushOptions {
  userId: string;
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  private emailTransporter: any;
  private smsClient: any;

  constructor() {
    this.emailTransporter = createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      
      await this.emailTransporter.sendMail({
        from: config.smtp.user,
        to: recipients.join(','),
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  async sendBulkEmails(emails: EmailOptions[]): Promise<number> {
    let sent = 0;
    for (const email of emails) {
      const success = await this.sendEmail(email);
      if (success) sent++;
    }
    return sent;
  }

  async sendSMS(options: SMSOptions): Promise<boolean> {
    try {
      console.log(`SMS to ${options.to}: ${options.message}`);
      return true;
    } catch (error) {
      console.error('SMS send error:', error);
      return false;
    }
  }

  async sendPushNotification(options: PushOptions): Promise<boolean> {
    try {
      const key = `push:notifications:${options.userId}`;
      await redis.lpush(key, JSON.stringify({
        title: options.title,
        body: options.body,
        data: options.data,
        timestamp: new Date().toISOString(),
      }));
      await redis.expire(key, 604800);
      return true;
    } catch (error) {
      console.error('Push notification error:', error);
      return false;
    }
  }

  async getUserNotifications(userId: string, limit: number = 20): Promise<any[]> {
    const key = `push:notifications:${userId}`;
    const notifications = await redis.lrange(key, 0, limit - 1);
    return notifications.map(n => JSON.parse(n));
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const key = `push:notifications:${userId}`;
    await redis.lrem(key, 1, notificationId);
  }

  async sendExamReminder(userId: string, testTitle: string, dueDate: Date): Promise<void> {
    const email = {
      to: userId,
      subject: `Exam Reminder: ${testTitle}`,
      text: `Your exam "${testTitle}" is due on ${dueDate.toLocaleString()}. Please log in to complete it.`,
    };
    await this.sendEmail(email);
  }

  async sendGradeNotification(userId: string, assignmentTitle: string, marks: number): Promise<void> {
    const email = {
      to: userId,
      subject: `Grade Posted: ${assignmentTitle}`,
      text: `Your grade for "${assignmentTitle}" is ${marks}. Check your dashboard for details.`,
    };
    await this.sendEmail(email);
  }

  async sendAttendanceNotification(userId: string, courseName: string, status: string): Promise<void> {
    const email = {
      to: userId,
      subject: `Attendance Alert: ${courseName}`,
      text: `Your attendance status for "${courseName}" is ${status}. Please contact your instructor if this is an error.`,
    };
    await this.sendEmail(email);
  }
}

export const notificationService = new NotificationService();