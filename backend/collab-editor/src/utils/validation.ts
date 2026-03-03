import { z } from 'zod';

/**
 * Validation schemas for BookClub endpoints
 */

export const createBookClubSchema = z.object({
  name: z.string().min(1, 'Book club name is required').max(100, 'Name too long'),
  imageUrl: z.string().url().optional(),
  category: z.string().min(1).max(50).optional(),
  isPublic: z.boolean().optional(),
});

export const updateBookClubSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  imageUrl: z.string().url().optional(),
  category: z.string().min(1).max(50).optional(),
  isPublic: z.boolean().optional(),
});

export const bookClubIdSchema = z.object({
  id: z.string().uuid('Invalid book club ID'),
});

/**
 * Validation schemas for Invite endpoints
 */

export const createInviteSchema = z.object({
  bookClubId: z.string().uuid('Invalid book club ID'),
  expiresAt: z.string().datetime().optional(),
  maxUses: z.number().int().positive().optional(),
});

export const inviteCodeSchema = z.object({
  code: z.string().length(8, 'Invalid invite code format'),
});

/**
 * Validation schemas for Event endpoints
 */

export const createEventSchema = z.object({
  title: z.string().min(1, 'Event title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional().nullable(),
  eventDate: z.string().min(1, 'Event date is required'),
  eventType: z.string().min(1).max(50).optional(),
});

export const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  eventDate: z.string().optional(),
  eventType: z.string().min(1).max(50).optional(),
});

export const eventIdSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
});

/**
 * Validation schemas for Room endpoints
 */

export const createRoomBodySchema = z.object({
  name: z.string().min(1, 'Room name is required').max(100, 'Name too long'),
  description: z.string().max(200, 'Description too long').optional(),
  type: z.enum(['PUBLIC', 'PRIVATE', 'ANNOUNCEMENT']).optional(),
  memberIds: z.array(z.string().uuid()).optional(),
});

export const updateRoomBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(200).optional(),
  type: z.enum(['PUBLIC', 'PRIVATE', 'ANNOUNCEMENT']).optional(),
});

/**
 * Validation schemas for Book Club endpoints (new controller)
 */

export const createClubSchema = z.object({
  name: z.string().min(1, 'Book club name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  category: z.string().min(1).max(50).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'INVITE_ONLY']).optional(),
  requiresApproval: z.boolean().optional(),
});

export const updateClubSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  category: z.string().min(1).max(50).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'INVITE_ONLY']).optional(),
  requiresApproval: z.boolean().optional(),
  imageUrl: z.string().url().optional().nullable(),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID'),
});

/**
 * Validation schemas for Meeting endpoints
 */

export const createMeetingSchema = z.object({
  title: z.string().min(1, 'Meeting title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional().nullable(),
  meetingUrl: z.string().url('Must be a valid URL').max(2000, 'URL too long'),
  platform: z.enum(['zoom', 'google_meet', 'teams', 'discord', 'custom']).optional(),
  scheduledAt: z.string().min(1, 'Scheduled date/time is required'),
  duration: z.number().int().min(5).max(480).optional().nullable(),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  meetingUrl: z.string().url().max(2000).optional(),
  platform: z.enum(['zoom', 'google_meet', 'teams', 'discord', 'custom']).optional(),
  scheduledAt: z.string().optional(),
  duration: z.number().int().min(5).max(480).optional().nullable(),
  status: z.enum(['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED']).optional(),
});

export const rsvpSchema = z.object({
  status: z.enum(['ATTENDING', 'MAYBE', 'NOT_ATTENDING']),
});
