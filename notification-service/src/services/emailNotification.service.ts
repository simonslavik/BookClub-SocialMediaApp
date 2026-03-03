import prisma from '../config/database.js';
import { sendEmail } from './email.service.js';
import {
  meetingCreatedEmail,
  meetingUpdatedEmail,
  meetingCancelledEmail,
  meetingReminderEmail,
} from './emailTemplates.service.js';
import logger from '../utils/logger.js';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';

/**
 * User info returned from user-service batch endpoint
 */
interface UserInfo {
  id: string;
  username: string;
  email: string;
  profileImage?: string;
  status?: string;
}

/**
 * Fetch user details (including emails) from user-service in batch
 */
async function fetchUsersByIds(userIds: string[]): Promise<UserInfo[]> {
  if (userIds.length === 0) return [];

  try {
    const res = await fetch(`${USER_SERVICE_URL}/users/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds }),
    });

    if (!res.ok) {
      logger.warn(`User-service batch returned ${res.status}`);
      return [];
    }

    const data = (await res.json()) as any;
    return data.users || [];
  } catch (err) {
    logger.error('Failed to fetch users from user-service:', err);
    return [];
  }
}

/**
 * Get notification preferences for a user.
 * Returns defaults (all enabled) if no preferences exist.
 */
async function getPreferences(userId: string) {
  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  // Default: everything enabled
  return prefs || {
    emailEnabled: true,
    meetingCreated: true,
    meetingUpdated: true,
    meetingCancelled: true,
    meetingReminder24h: true,
    meetingReminder1h: true,
    meetingStarting: true,
  };
}

/**
 * Map notification types to preference fields
 */
const TYPE_TO_PREF: Record<string, keyof Awaited<ReturnType<typeof getPreferences>>> = {
  meeting_created: 'meetingCreated',
  meeting_updated: 'meetingUpdated',
  meeting_cancelled: 'meetingCancelled',
  reminder_24h: 'meetingReminder24h',
  meeting_reminder_24h: 'meetingReminder24h',
  reminder_1h: 'meetingReminder1h',
  meeting_reminder_1h: 'meetingReminder1h',
  meeting_starting: 'meetingStarting',
};

/**
 * Check if an email was already sent for this meeting + type + user (dedup)
 */
async function wasAlreadySent(userId: string, meetingId: string, type: string): Promise<boolean> {
  const existing = await prisma.emailLog.findFirst({
    where: {
      userId,
      meetingId,
      type,
      status: 'sent',
    },
  });
  return !!existing;
}

/**
 * Log an email send attempt
 */
async function logEmail(params: {
  notificationId?: string;
  userId: string;
  email: string;
  subject: string;
  type: string;
  meetingId?: string;
  status: 'sent' | 'failed';
  errorMessage?: string;
}) {
  try {
    await prisma.emailLog.create({ data: params });
  } catch (err) {
    logger.error('Failed to log email:', err);
  }
}

/**
 * Send meeting-related emails to a list of users.
 * Respects preferences, deduplicates, and logs all sends.
 */
export async function sendMeetingEmails(params: {
  type: 'meeting_created' | 'meeting_updated' | 'meeting_cancelled';
  userIds: string[];
  clubId: string;
  meetingId: string;
  meetingTitle: string;
  clubName?: string;
  scheduledAt?: string;
  excludeUserId?: string;
}) {
  const filteredUserIds = params.excludeUserId
    ? params.userIds.filter((id) => id !== params.excludeUserId)
    : params.userIds;

  if (filteredUserIds.length === 0) return;

  // Fetch user info for email addresses
  const users = await fetchUsersByIds(filteredUserIds);
  if (users.length === 0) {
    logger.warn('No users found for email notification');
    return;
  }

  // Fetch club name if not provided
  const clubName = params.clubName || 'your book club';

  for (const user of users) {
    try {
      // Check preferences
      const prefs = await getPreferences(user.id);
      const prefKey = TYPE_TO_PREF[params.type];

      if (!prefs.emailEnabled || (prefKey && !prefs[prefKey])) {
        logger.debug(`Email skipped for ${user.id} — disabled by preferences`);
        continue;
      }

      // Dedup check
      if (await wasAlreadySent(user.id, params.meetingId, params.type)) {
        logger.debug(`Email already sent for ${user.id} / ${params.meetingId} / ${params.type}`);
        continue;
      }

      // Generate email
      let emailContent: { subject: string; html: string };

      switch (params.type) {
        case 'meeting_created':
          emailContent = meetingCreatedEmail({
            userName: user.username || 'there',
            meetingTitle: params.meetingTitle,
            clubName,
            scheduledAt: params.scheduledAt || new Date().toISOString(),
          });
          break;

        case 'meeting_updated':
          emailContent = meetingUpdatedEmail({
            userName: user.username || 'there',
            meetingTitle: params.meetingTitle,
            clubName,
            scheduledAt: params.scheduledAt,
          });
          break;

        case 'meeting_cancelled':
          emailContent = meetingCancelledEmail({
            userName: user.username || 'there',
            meetingTitle: params.meetingTitle,
            clubName,
          });
          break;
      }

      // Send
      const sent = await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
      });

      // Log
      await logEmail({
        userId: user.id,
        email: user.email,
        subject: emailContent.subject,
        type: params.type,
        meetingId: params.meetingId,
        status: sent ? 'sent' : 'failed',
        errorMessage: sent ? undefined : 'sendEmail returned false',
      });
    } catch (err) {
      logger.error(`Error sending email to user ${user.id}:`, err);
      await logEmail({
        userId: user.id,
        email: user.email,
        subject: `${params.type} notification`,
        type: params.type,
        meetingId: params.meetingId,
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

/**
 * Send reminder emails for a scheduled notification.
 * Called by the scheduler when reminders are due.
 */
export async function sendReminderEmails(params: {
  type: 'reminder_24h' | 'reminder_1h' | 'meeting_starting';
  userIds: string[];
  meetingId: string;
  meetingTitle: string;
  clubName: string;
  scheduledAt: string;
}) {
  const users = await fetchUsersByIds(params.userIds);
  if (users.length === 0) return;

  for (const user of users) {
    try {
      const prefs = await getPreferences(user.id);
      const prefKey = TYPE_TO_PREF[params.type];

      if (!prefs.emailEnabled || (prefKey && !prefs[prefKey])) {
        continue;
      }

      if (await wasAlreadySent(user.id, params.meetingId, params.type)) {
        continue;
      }

      const emailContent = meetingReminderEmail({
        userName: user.username || 'there',
        meetingTitle: params.meetingTitle,
        clubName: params.clubName,
        scheduledAt: params.scheduledAt,
        reminderType: params.type,
      });

      const sent = await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
      });

      await logEmail({
        userId: user.id,
        email: user.email,
        subject: emailContent.subject,
        type: params.type,
        meetingId: params.meetingId,
        status: sent ? 'sent' : 'failed',
      });
    } catch (err) {
      logger.error(`Error sending reminder email to user ${user.id}:`, err);
    }
  }
}
