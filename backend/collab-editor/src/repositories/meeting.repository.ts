import { MeetingStatus, RSVPStatus } from '@prisma/client';
import prisma from '../config/database.js';

export class MeetingRepository {
  /**
   * Create a new meeting
   */
  static async create(data: {
    bookClubId: string;
    title: string;
    description?: string | null;
    meetingUrl: string;
    platform?: string;
    hostId: string;
    scheduledAt: Date;
    duration?: number | null;
  }) {
    return prisma.meeting.create({
      data,
      include: {
        rsvps: true,
        _count: { select: { rsvps: true } },
      },
    });
  }

  /**
   * Find meeting by ID
   */
  static async findById(id: string) {
    return prisma.meeting.findUnique({
      where: { id },
      include: {
        rsvps: true,
        _count: { select: { rsvps: true } },
      },
    });
  }

  /**
   * Find all meetings for a book club (upcoming first)
   */
  static async findByBookClub(bookClubId: string, includesPast = false) {
    const where: any = { bookClubId };
    if (!includesPast) {
      where.OR = [
        { status: MeetingStatus.SCHEDULED },
        { status: MeetingStatus.LIVE },
      ];
    }

    return prisma.meeting.findMany({
      where,
      include: {
        rsvps: true,
        _count: { select: { rsvps: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  /**
   * Update a meeting
   */
  static async update(id: string, data: {
    title?: string;
    description?: string | null;
    meetingUrl?: string;
    platform?: string;
    scheduledAt?: Date;
    duration?: number | null;
    status?: MeetingStatus;
  }) {
    return prisma.meeting.update({
      where: { id },
      data,
      include: {
        rsvps: true,
        _count: { select: { rsvps: true } },
      },
    });
  }

  /**
   * Delete a meeting
   */
  static async delete(id: string) {
    return prisma.meeting.delete({ where: { id } });
  }

  /**
   * Upsert RSVP (create or update)
   */
  static async upsertRSVP(meetingId: string, userId: string, status: RSVPStatus) {
    return prisma.meeting_RSVP.upsert({
      where: {
        meetingId_userId: { meetingId, userId },
      },
      create: { meetingId, userId, status },
      update: { status },
    });
  }

  /**
   * Delete RSVP
   */
  static async deleteRSVP(meetingId: string, userId: string) {
    return prisma.meeting_RSVP.deleteMany({
      where: { meetingId, userId },
    });
  }

  /**
   * Get RSVPs for a meeting
   */
  static async getRSVPs(meetingId: string) {
    return prisma.meeting_RSVP.findMany({
      where: { meetingId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
