import { InviteRepository } from '../repositories/invite.repository.js';
import { generateInviteCode } from '../utils/inviteCodeGenerator.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

export class InviteService {
  /**
   * Get or create invite for a book club
   */
  static async getInvite(bookClubId: string, userId: string) {
    // Check if bookclub exists
    const bookClub = await prisma.bookClub.findUnique({
      where: { id: bookClubId },
    });

    if (!bookClub) {
      throw new Error('Book club not found');
    }

    // Check if user is creator or active member
    const isMember = bookClub.creatorId === userId || await prisma.bookClubMember.findUnique({
      where: { bookClubId_userId: { bookClubId, userId }, status: 'ACTIVE' },
    });

    if (!isMember) {
      throw new Error('Only book club members can view invite');
    }

    // Get existing invite or create one
    let invite = await prisma.bookClubInvite.findFirst({
      where: { bookClubId }
    });

    if (!invite) {
      // Generate unique invite code
      let code = generateInviteCode();
      let existing = await InviteRepository.findByCode(code);
      
      while (existing) {
        code = generateInviteCode();
        existing = await InviteRepository.findByCode(code);
      }

      invite = await InviteRepository.create({
        bookClubId,
        code,
        createdBy: userId,
        expiresAt: null,
        maxUses: null
      });

      logger.info('INVITE_CREATED', { code, bookClubName: bookClub.name });
    }

    return invite;
  }

  /**
   * Join a book club via invite code
   */
  static async joinViaInvite(code: string, userId: string) {
    // Find invite
    const invite = await prisma.bookClubInvite.findUnique({
      where: { code },
      include: { bookClub: true }
    });

    if (!invite) {
      throw new Error('Invalid invite code');
    }

    // Check if expired
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new Error('This invite has expired');
    }

    // Check if max uses reached
    if (invite.maxUses && invite.currentUses >= invite.maxUses) {
      throw new Error('This invite has reached its maximum uses');
    }

    // Check if user is already a member
    const existingMember = await prisma.bookClubMember.findFirst({
      where: {
        bookClubId: invite.bookClubId,
        userId: userId
      }
    });

    if (existingMember) {
      throw new Error('You are already a member of this book club');
    }

    // Check if user is the creator
    if (invite.bookClub.creatorId === userId) {
      throw new Error('You are already a member of this book club');
    }

    // Add user as a member
    await prisma.bookClubMember.create({
      data: {
        bookClubId: invite.bookClubId,
        userId: userId,
        role: 'MEMBER',
        status: 'ACTIVE'
      }
    });

    // Increment invite uses
    await InviteRepository.incrementUses(invite.id);

    logger.info('USER_JOINED_VIA_INVITE', { userId, bookClubName: invite.bookClub.name, code });

    return invite.bookClub;
  }

  /**
   * Create a new invite
   */
  static async create(bookClubId: string, userId: string, data: {
    expiresAt?: string | null;
    maxUses?: number | null;
  }) {
    const bookClub = await prisma.bookClub.findUnique({
      where: { id: bookClubId },
    });

    if (!bookClub) {
      throw new Error('Book club not found');
    }

    // Check if user is creator or active member
    const isMember = bookClub.creatorId === userId || await prisma.bookClubMember.findUnique({
      where: { bookClubId_userId: { bookClubId, userId }, status: 'ACTIVE' },
    });

    if (!isMember) {
      throw new Error('Only book club members can create invites');
    }

    // Generate unique code
    let code = generateInviteCode();
    let existing = await InviteRepository.findByCode(code);
    
    while (existing) {
      code = generateInviteCode();
      existing = await InviteRepository.findByCode(code);
    }

    const invite = await InviteRepository.create({
      bookClubId,
      code,
      createdBy: userId,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      maxUses: data.maxUses || null
    });

    logger.info('INVITE_CREATED', { code, bookClubName: bookClub.name });

    return invite;
  }

  /**
   * Get all invites for a book club
   */
  static async getAllInvites(bookClubId: string, userId: string) {
    const bookClub = await prisma.bookClub.findUnique({
      where: { id: bookClubId },
    });

    if (!bookClub) {
      throw new Error('Book club not found');
    }

    if (bookClub.creatorId !== userId) {
      throw new Error('Only the book club creator can view all invites');
    }

    return InviteRepository.findByBookClub(bookClubId);
  }

  /**
   * Delete an invite
   */
  static async delete(inviteId: string, userId: string) {
    const invite = await prisma.bookClubInvite.findUnique({
      where: { id: inviteId },
      include: { bookClub: true }
    });

    if (!invite) {
      throw new Error('Invite not found');
    }

    if (invite.bookClub.creatorId !== userId && invite.createdBy !== userId) {
      throw new Error('Only the creator or invite owner can delete this invite');
    }

    await InviteRepository.delete(inviteId);

    logger.info('INVITE_DELETED', { code: invite.code });
  }
}
