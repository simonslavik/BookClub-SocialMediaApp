import prisma from '../config/database.js';
import logger from './logger.js';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005';

interface MeetingEventPayload {
  type: 'meeting_created' | 'meeting_updated' | 'meeting_cancelled';
  clubId: string;
  meetingId: string;
  meetingTitle: string;
  scheduledAt?: string;
  excludeUserId?: string;
}

/**
 * Send a meeting notification event to the notification-service.
 * Fetches active club member userIds and sends them along with the event data.
 * 
 * This is fire-and-forget — failures are logged but don't block the caller.
 */
export async function notifyMeetingEvent(payload: MeetingEventPayload) {
  try {
    // Fetch all active members of the club
    const members = await prisma.bookClubMember.findMany({
      where: {
        bookClubId: payload.clubId,
        status: 'ACTIVE',
      },
      select: { userId: true },
    });

    const userIds = members.map(m => m.userId);

    if (userIds.length === 0) {
      logger.debug('No active members to notify for meeting event');
      return;
    }

    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/notifications/internal/meeting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        userIds,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.warn(`Notification service returned ${response.status}: ${text}`);
    } else {
      const data = await response.json() as any;
      logger.info(`Meeting notification sent: ${payload.type} → ${data.notified} users notified`);
    }
  } catch (err) {
    logger.warn('Failed to reach notification service:', err);
  }
}
