import prisma from '../config/database.js';
import { NotificationService } from './notification.service.js';
import logger from '../utils/logger.js';

const REMINDER_TEMPLATES: Record<string, { title: string; message: (name: string) => string }> = {
  reminder_24h: {
    title: '📅 Meeting Tomorrow',
    message: (name) => `"${name}" starts in 24 hours. Don't forget to prepare!`,
  },
  reminder_1h: {
    title: '⏰ Meeting in 1 Hour',
    message: (name) => `"${name}" starts in 1 hour. Get ready!`,
  },
  meeting_starting: {
    title: '🚀 Meeting Starting Now',
    message: (name) => `"${name}" is starting now! Join in.`,
  },
};

/**
 * Process all scheduled notifications that are due.
 * Fetches meeting member lists from collab-editor to know who to notify.
 */
async function processScheduledNotifications() {
  try {
    const now = new Date();

    const due = await prisma.scheduledNotification.findMany({
      where: {
        sent: false,
        scheduledAt: { lte: now },
      },
      take: 100,
    });

    if (due.length === 0) return;

    logger.info(`Processing ${due.length} scheduled notification(s)`);

    for (const scheduled of due) {
      try {
        const template = REMINDER_TEMPLATES[scheduled.type];
        if (!template) {
          logger.warn(`Unknown reminder type: ${scheduled.type}`);
          await prisma.scheduledNotification.update({
            where: { id: scheduled.id },
            data: { sent: true },
          });
          continue;
        }

        // Fetch meeting details & club members from collab-editor
        const collabUrl = process.env.COLLAB_EDITOR_URL || 'http://collab-editor:4000';
        
        // Get meeting info
        let meetingTitle = 'Book Club Meeting';
        let memberUserIds: string[] = [];

        try {
          // Get meeting details from collab-editor
          const meetingRes = await fetch(`${collabUrl}/bookclubs/${scheduled.clubId}/meetings`, {
            headers: { 'x-user-id': 'system', 'x-user-email': 'system@internal' },
          });

          if (meetingRes.ok) {
            const meetingData = await meetingRes.json() as any;
            const meetings = meetingData.data || meetingData.meetings || [];
            const meeting = meetings.find((m: any) => m.id === scheduled.meetingId);
            if (meeting) {
              meetingTitle = meeting.title || meetingTitle;
            }
          }
        } catch (err) {
          logger.warn('Failed to fetch meeting details from collab-editor', err);
        }

        try {
          // Get club member list from collab-editor
          const membersRes = await fetch(`${collabUrl}/bookclubs/${scheduled.clubId}`, {
            headers: { 'x-user-id': 'system', 'x-user-email': 'system@internal' },
          });

          if (membersRes.ok) {
            const clubData = await membersRes.json() as any;
            const club = clubData.data || clubData;
            const members = club.members || [];
            memberUserIds = members
              .filter((m: any) => m.status === 'ACTIVE')
              .map((m: any) => m.userId || m.id);
          }
        } catch (err) {
          logger.warn('Failed to fetch club members from collab-editor', err);
        }

        if (memberUserIds.length > 0) {
          await NotificationService.notifyMultipleUsers(
            memberUserIds,
            scheduled.clubId,
            `meeting_${scheduled.type}`,
            template.title,
            template.message(meetingTitle),
            scheduled.meetingId
          );
          logger.info(`Sent ${scheduled.type} reminder to ${memberUserIds.length} members for meeting ${scheduled.meetingId}`);
        }

        // Mark as sent
        await prisma.scheduledNotification.update({
          where: { id: scheduled.id },
          data: { sent: true },
        });
      } catch (err) {
        logger.error(`Error processing scheduled notification ${scheduled.id}:`, err);
      }
    }
  } catch (err) {
    logger.error('Error in processScheduledNotifications:', err);
  }
}

let intervalId: NodeJS.Timeout | null = null;

/**
 * Start the scheduler — checks every 30 seconds for due notifications
 */
export function startScheduler() {
  if (intervalId) return;

  logger.info('🔔 Notification scheduler started (30s interval)');
  intervalId = setInterval(processScheduledNotifications, 30_000);

  // Run once immediately
  processScheduledNotifications();
}

/**
 * Stop the scheduler
 */
export function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Notification scheduler stopped');
  }
}
