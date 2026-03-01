import { MeetingRepository } from '../repositories/meeting.repository.js';
import { BookClubRepository } from '../repositories/bookClub.repository.js';
import prisma from '../config/database.js';
import { MeetingStatus, RSVPStatus, MembershipStatus } from '@prisma/client';
import { hasMinRole } from '../utils/roles.js';
import { BookClubRole } from '@prisma/client';
import logger from '../utils/logger.js';
import { notifyMeetingEvent } from '../utils/notificationClient.js';

// Auto-detect platform from meeting URL
function detectPlatform(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('zoom.us') || lower.includes('zoom.com')) return 'zoom';
  if (lower.includes('meet.google.com')) return 'google_meet';
  if (lower.includes('teams.microsoft.com') || lower.includes('teams.live.com')) return 'teams';
  if (lower.includes('discord.gg') || lower.includes('discord.com')) return 'discord';
  return 'custom';
}

interface CreateMeetingDto {
  title: string;
  description?: string;
  meetingUrl: string;
  platform?: string;
  scheduledAt: string; // ISO date string
  duration?: number;
}

interface UpdateMeetingDto {
  title?: string;
  description?: string;
  meetingUrl?: string;
  platform?: string;
  scheduledAt?: string;
  duration?: number;
  status?: MeetingStatus;
}

export class MeetingService {
  /**
   * Create a new meeting in a book club
   */
  static async create(bookClubId: string, userId: string, data: CreateMeetingDto) {
    // Verify book club exists
    const bookClub = await BookClubRepository.findById(bookClubId);
    if (!bookClub) throw new Error('Book club not found');

    // Check membership
    const membership = await prisma.bookClubMember.findUnique({
      where: { bookClubId_userId: { bookClubId, userId } },
    });
    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new Error('You must be a member to schedule meetings');
    }

    // Auto-detect platform if not provided
    const platform = data.platform || detectPlatform(data.meetingUrl);

    const meeting = await MeetingRepository.create({
      bookClubId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      meetingUrl: data.meetingUrl.trim(),
      platform,
      hostId: userId,
      scheduledAt: new Date(data.scheduledAt),
      duration: data.duration || null,
    });

    // Auto-RSVP the host as ATTENDING
    await MeetingRepository.upsertRSVP(meeting.id, userId, RSVPStatus.ATTENDING);

    logger.info('MEETING_CREATED', { bookClubId, title: meeting.title, platform });

    // Notify all club members about the new meeting
    notifyMeetingEvent({
      type: 'meeting_created',
      clubId: bookClubId,
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      scheduledAt: meeting.scheduledAt.toISOString(),
      excludeUserId: userId,
    }).catch(err => logger.warn('Failed to send meeting notification', err));

    // Re-fetch to include the host RSVP
    return MeetingRepository.findById(meeting.id);
  }

  /**
   * Get all meetings for a book club
   */
  static async getMeetings(bookClubId: string, includePast = false) {
    const bookClub = await BookClubRepository.findById(bookClubId);
    if (!bookClub) throw new Error('Book club not found');

    return MeetingRepository.findByBookClub(bookClubId, includePast);
  }

  /**
   * Update a meeting (host or admin+)
   */
  static async update(meetingId: string, userId: string, bookClubId: string, data: UpdateMeetingDto) {
    const meeting = await MeetingRepository.findById(meetingId);
    if (!meeting) throw new Error('Meeting not found');
    if (meeting.bookClubId !== bookClubId) throw new Error('Meeting not found');

    // Check permissions: host or admin+
    const isHost = meeting.hostId === userId;
    if (!isHost) {
      const membership = await prisma.bookClubMember.findUnique({
        where: { bookClubId_userId: { bookClubId, userId } },
      });
      if (!membership || !hasMinRole(membership.role, BookClubRole.ADMIN)) {
        throw new Error('Only the meeting host or admins can update meetings');
      }
    }

    const updateData: any = {};
    if (data.title) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.meetingUrl) {
      updateData.meetingUrl = data.meetingUrl.trim();
      updateData.platform = data.platform || detectPlatform(data.meetingUrl);
    }
    if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
    if (data.duration !== undefined) updateData.duration = data.duration || null;
    if (data.status) updateData.status = data.status;

    const updated = await MeetingRepository.update(meetingId, updateData);

    logger.info('MEETING_UPDATED', { meetingId, title: updated.title });

    // Notify club members about the update
    notifyMeetingEvent({
      type: 'meeting_updated',
      clubId: bookClubId,
      meetingId,
      meetingTitle: updated.title,
      scheduledAt: updated.scheduledAt.toISOString(),
      excludeUserId: userId,
    }).catch(err => logger.warn('Failed to send meeting update notification', err));

    return updated;
  }

  /**
   * Delete a meeting (host or admin+)
   */
  static async delete(meetingId: string, userId: string, bookClubId: string) {
    const meeting = await MeetingRepository.findById(meetingId);
    if (!meeting) throw new Error('Meeting not found');
    if (meeting.bookClubId !== bookClubId) throw new Error('Meeting not found');

    const isHost = meeting.hostId === userId;
    if (!isHost) {
      const membership = await prisma.bookClubMember.findUnique({
        where: { bookClubId_userId: { bookClubId, userId } },
      });
      if (!membership || !hasMinRole(membership.role, BookClubRole.ADMIN)) {
        throw new Error('Only the meeting host or admins can delete meetings');
      }
    }

    // Notify club members about the cancellation before deleting
    notifyMeetingEvent({
      type: 'meeting_cancelled',
      clubId: bookClubId,
      meetingId,
      meetingTitle: meeting.title,
      excludeUserId: userId,
    }).catch(err => logger.warn('Failed to send meeting delete notification', err));

    await MeetingRepository.delete(meetingId);

    logger.info('MEETING_DELETED', { meetingId });
  }

  /**
   * RSVP to a meeting
   */
  static async rsvp(meetingId: string, userId: string, bookClubId: string, status: RSVPStatus) {
    const meeting = await MeetingRepository.findById(meetingId);
    if (!meeting) throw new Error('Meeting not found');
    if (meeting.bookClubId !== bookClubId) throw new Error('Meeting not found');

    // Check membership
    const membership = await prisma.bookClubMember.findUnique({
      where: { bookClubId_userId: { bookClubId, userId } },
    });
    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new Error('You must be a member to RSVP');
    }

    await MeetingRepository.upsertRSVP(meetingId, userId, status);

    logger.info('MEETING_RSVP', { meetingId, userId, status });

    return MeetingRepository.findById(meetingId);
  }

  /**
   * Cancel RSVP
   */
  static async cancelRSVP(meetingId: string, userId: string, bookClubId: string) {
    const meeting = await MeetingRepository.findById(meetingId);
    if (!meeting) throw new Error('Meeting not found');
    if (meeting.bookClubId !== bookClubId) throw new Error('Meeting not found');

    await MeetingRepository.deleteRSVP(meetingId, userId);

    return MeetingRepository.findById(meetingId);
  }
}
