import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
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
      const { id } = req.params;
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
      const { id } = req.params;
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
      const { type, clubId, meetingId, meetingTitle, scheduledAt, userIds, excludeUserId } = req.body;

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

      logger.info(`Processed meeting event: ${type}`, { meetingId, clubId, notified: notifications.length });

      res.json({ success: true, notified: notifications.length });
    } catch (err) {
      logger.error('Error handling meeting event:', err);
      res.status(500).json({ success: false, message: 'Failed to process meeting event' });
    }
  }
}
