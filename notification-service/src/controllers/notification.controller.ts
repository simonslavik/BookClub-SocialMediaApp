import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { sendMeetingEmails } from '../services/emailNotification.service.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

export class NotificationController {
  /**
   * GET /notifications — list notifications for the authenticated user
   */
  static async getNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

      const result = await NotificationService.getAll(userId, page, limit);
      res.json({ success: true, ...result });
    } catch (err) {
      logger.error('Error fetching notifications:', err);
      res.status(500).json({ success: false, message: 'Failed to get notifications' });
    }
  }

  /**
   * GET /notifications/unread-count
   */
  static async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const count = await NotificationService.getUnreadCount(userId);
      res.json({ success: true, count });
    } catch (err) {
      logger.error('Error fetching unread count:', err);
      res.status(500).json({ success: false, message: 'Failed to get unread count' });
    }
  }

  /**
   * PATCH /notifications/:id/read — mark one notification as read
   */
  static async markRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const id = req.params.id as string;
      await NotificationService.markRead(id, userId);
      res.json({ success: true });
    } catch (err) {
      logger.error('Error marking notification read:', err);
      res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
    }
  }

  /**
   * PATCH /notifications/read-all — mark all as read
   */
  static async markAllRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      await NotificationService.markAllRead(userId);
      res.json({ success: true });
    } catch (err) {
      logger.error('Error marking all notifications read:', err);
      res.status(500).json({ success: false, message: 'Failed to mark all as read' });
    }
  }

  /**
   * DELETE /notifications/:id — dismiss a notification
   */
  static async dismiss(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const id = req.params.id as string;
      await NotificationService.dismiss(id, userId);
      res.json({ success: true });
    } catch (err) {
      logger.error('Error dismissing notification:', err);
      res.status(500).json({ success: false, message: 'Failed to dismiss notification' });
    }
  }

  /**
   * POST /notifications/internal/meeting — internal endpoint called by collab-editor
   * when a meeting is created, updated, or deleted.
   * Body: { type, clubId, meetingId, meetingTitle, scheduledAt, userIds, excludeUserId }
   */
  static async handleMeetingEvent(req: Request, res: Response) {
    try {
      const { type, clubId, meetingId, meetingTitle, scheduledAt, userIds, excludeUserId, clubName } = req.body;

      if (!type || !clubId || !meetingId || !userIds || !Array.isArray(userIds)) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      let title = '';
      let message = '';

      switch (type) {
        case 'meeting_created':
          title = '📅 New Meeting Scheduled';
          message = `A new meeting "${meetingTitle}" has been scheduled for ${new Date(scheduledAt).toLocaleDateString()}.`;
          // Also schedule reminders
          if (scheduledAt) {
            await NotificationService.scheduleMeetingReminders(meetingId, clubId, new Date(scheduledAt));
          }
          break;

        case 'meeting_updated':
          title = '📝 Meeting Updated';
          message = `The meeting "${meetingTitle}" has been updated.`;
          // Reschedule reminders if date changed
          if (scheduledAt) {
            await NotificationService.scheduleMeetingReminders(meetingId, clubId, new Date(scheduledAt));
          }
          break;

        case 'meeting_cancelled':
          title = '❌ Meeting Cancelled';
          message = `The meeting "${meetingTitle}" has been cancelled.`;
          // Cancel scheduled reminders
          await NotificationService.cancelMeetingReminders(meetingId);
          break;

        default:
          return res.status(400).json({ success: false, message: `Unknown event type: ${type}` });
      }

      const notifications = await NotificationService.notifyMultipleUsers(
        userIds,
        clubId,
        type,
        title,
        message,
        meetingId,
        excludeUserId
      );

      // Send email notifications asynchronously (don't block the response)
      sendMeetingEmails({
        type: type as 'meeting_created' | 'meeting_updated' | 'meeting_cancelled',
        userIds,
        clubId,
        meetingId,
        meetingTitle: meetingTitle || 'Book Club Meeting',
        clubName: clubName || undefined,
        scheduledAt,
        excludeUserId,
      }).catch((err) => logger.error('Email notification error:', err));

      logger.info(`Processed meeting event: ${type}`, { meetingId, clubId, notified: notifications.length });

      res.json({ success: true, notified: notifications.length });
    } catch (err) {
      logger.error('Error handling meeting event:', err);
      res.status(500).json({ success: false, message: 'Failed to process meeting event' });
    }
  }

  /**
   * GET /notifications/preferences — get user's notification preferences
   */
  static async getPreferences(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;

      let prefs = await prisma.notificationPreference.findUnique({
        where: { userId },
      });

      if (!prefs) {
        // Return defaults
        prefs = {
          id: '',
          userId,
          emailEnabled: true,
          meetingCreated: true,
          meetingUpdated: true,
          meetingCancelled: true,
          meetingReminder24h: true,
          meetingReminder1h: true,
          meetingStarting: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      res.json({ success: true, preferences: prefs });
    } catch (err) {
      logger.error('Error fetching preferences:', err);
      res.status(500).json({ success: false, message: 'Failed to get preferences' });
    }
  }

  /**
   * PUT /notifications/preferences — update notification preferences
   */
  static async updatePreferences(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const {
        emailEnabled,
        meetingCreated,
        meetingUpdated,
        meetingCancelled,
        meetingReminder24h,
        meetingReminder1h,
        meetingStarting,
      } = req.body;

      const data: any = {};
      if (typeof emailEnabled === 'boolean') data.emailEnabled = emailEnabled;
      if (typeof meetingCreated === 'boolean') data.meetingCreated = meetingCreated;
      if (typeof meetingUpdated === 'boolean') data.meetingUpdated = meetingUpdated;
      if (typeof meetingCancelled === 'boolean') data.meetingCancelled = meetingCancelled;
      if (typeof meetingReminder24h === 'boolean') data.meetingReminder24h = meetingReminder24h;
      if (typeof meetingReminder1h === 'boolean') data.meetingReminder1h = meetingReminder1h;
      if (typeof meetingStarting === 'boolean') data.meetingStarting = meetingStarting;

      const prefs = await prisma.notificationPreference.upsert({
        where: { userId },
        update: data,
        create: { userId, ...data },
      });

      res.json({ success: true, preferences: prefs });
    } catch (err) {
      logger.error('Error updating preferences:', err);
      res.status(500).json({ success: false, message: 'Failed to update preferences' });
    }
  }
}
