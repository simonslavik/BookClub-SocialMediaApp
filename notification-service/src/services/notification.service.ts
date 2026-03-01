import prisma from '../config/database.js';
import logger from '../utils/logger.js';

interface CreateNotificationParams {
  userId: string;
  clubId: string;
  type: string;
  title: string;
  message: string;
  meetingId?: string;
}

// WebSocket broadcast function — set by the WS setup
let broadcastToUser: ((userId: string, data: any) => void) | null = null;

export function setBroadcastFunction(fn: (userId: string, data: any) => void) {
  broadcastToUser = fn;
}

export class NotificationService {
  /**
   * Create a notification and deliver it in real-time via WebSocket
   */
  static async create(params: CreateNotificationParams) {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        clubId: params.clubId,
        type: params.type,
        title: params.title,
        message: params.message,
        meetingId: params.meetingId || null,
      },
    });

    // Deliver via WebSocket if user is connected
    if (broadcastToUser) {
      broadcastToUser(params.userId, {
        type: 'notification',
        data: notification,
      });
    }

    return notification;
  }

  /**
   * Create notifications for multiple users (e.g., all club members)
   */
  static async notifyMultipleUsers(
    userIds: string[],
    clubId: string,
    type: string,
    title: string,
    message: string,
    meetingId?: string,
    excludeUserId?: string
  ) {
    const notifications = [];
    for (const userId of userIds) {
      if (excludeUserId && userId === excludeUserId) continue;
      try {
        const n = await this.create({
          userId,
          clubId,
          type,
          title,
          message,
          meetingId,
        });
        notifications.push(n);
      } catch (err) {
        logger.error(`Failed to create notification for user ${userId}`, err);
      }
    }
    return notifications;
  }

  /**
   * Get all notifications for a user (paginated), not dismissed
   */
  static async getAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId, dismissed: false },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({
        where: { userId, dismissed: false },
      }),
    ]);

    return { notifications, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, read: false, dismissed: false },
    });
  }

  /**
   * Mark a specific notification as read
   */
  static async markRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  /**
   * Dismiss (soft-delete) a notification
   */
  static async dismiss(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { dismissed: true },
    });
  }

  /**
   * Schedule reminder notifications for a meeting
   */
  static async scheduleMeetingReminders(meetingId: string, clubId: string, scheduledAt: Date) {
    const now = new Date();

    // Remove any existing scheduled notifications for this meeting
    await prisma.scheduledNotification.deleteMany({
      where: { meetingId },
    });

    const reminders: Array<{
      meetingId: string;
      clubId: string;
      type: string;
      scheduledAt: Date;
      sent: boolean;
    }> = [];

    // 24 hours before
    const reminder24h = new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000);
    if (reminder24h > now) {
      reminders.push({ meetingId, clubId, type: 'reminder_24h', scheduledAt: reminder24h, sent: false });
    }

    // 1 hour before
    const reminder1h = new Date(scheduledAt.getTime() - 60 * 60 * 1000);
    if (reminder1h > now) {
      reminders.push({ meetingId, clubId, type: 'reminder_1h', scheduledAt: reminder1h, sent: false });
    }

    // At meeting time
    if (scheduledAt > now) {
      reminders.push({ meetingId, clubId, type: 'meeting_starting', scheduledAt, sent: false });
    }

    if (reminders.length > 0) {
      await prisma.scheduledNotification.createMany({ data: reminders });
    }

    logger.info(`Scheduled ${reminders.length} reminders for meeting ${meetingId}`);
    return reminders.length;
  }

  /**
   * Cancel all scheduled reminders for a meeting
   */
  static async cancelMeetingReminders(meetingId: string) {
    const result = await prisma.scheduledNotification.deleteMany({
      where: { meetingId },
    });
    logger.info(`Cancelled ${result.count} reminders for meeting ${meetingId}`);
    return result.count;
  }
}
