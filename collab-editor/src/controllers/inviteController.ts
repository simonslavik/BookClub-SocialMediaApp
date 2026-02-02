import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { generateInviteCode } from '../utils/inviteCodeGenerator.js';

const prisma = new PrismaClient();

// Get invite for a bookclub
export const getInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId } = req.params;
    const userId = req.user!.userId;

    // Check if bookclub exists and user is creator or member
    const bookClub = await prisma.bookClub.findUnique({
      where: { id: bookClubId }
    });

    if (!bookClub) {
      return res.status(404).json({ error: 'Book club not found' });
    }

    if (bookClub.creatorId !== userId && !bookClub.members.includes(userId)) {
      return res.status(403).json({ error: 'Only book club members can view invite' });
    }

    // Get existing invite or create one
    let invite = await prisma.bookClubInvite.findFirst({
      where: { bookClubId }
    });

    if (!invite) {
      // Generate unique invite code
      let code = generateInviteCode();
      let existing = await prisma.bookClubInvite.findUnique({ where: { code } });
      while (existing) {
        code = generateInviteCode();
        existing = await prisma.bookClubInvite.findUnique({ where: { code } });
      }

      invite = await prisma.bookClubInvite.create({
        data: {
          bookClubId,
          code,
          createdBy: userId,
          expiresAt: null,
          maxUses: null
        }
      });

      console.log(`📨 Invite created: ${code} for bookclub ${bookClub.name}`);
    }

    res.json({ success: true, invite });
  } catch (error) {
    console.error('Error fetching invite:', error);
    res.status(500).json({ error: 'Failed to fetch invite' });
  }
};

// Join bookclub via invite code
export const joinViaInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;
    const userId = req.user!.userId;

    // Find invite
    const invite = await prisma.bookClubInvite.findUnique({
      where: { code },
      include: { bookClub: true }
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Check if expired
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return res.status(400).json({ error: 'This invite has expired' });
    }

    // Check if max uses reached
    if (invite.maxUses && invite.currentUses >= invite.maxUses) {
      return res.status(400).json({ error: 'This invite has reached its maximum uses' });
    }

    // Check if user is already a member
    const bookClub = await prisma.bookClub.findUnique({
      where: { id: invite.bookClubId }
    });

    if (!bookClub) {
      return res.status(404).json({ error: 'Book club not found' });
    }

    if (bookClub.members.includes(userId) || bookClub.creatorId === userId) {
      return res.status(400).json({ error: 'You are already a member of this book club' });
    }

    // Add user to bookclub
    await prisma.bookClub.update({
      where: { id: invite.bookClubId },
      data: {
        members: {
          push: userId
        }
      }
    });

    // Increment invite uses
    await prisma.bookClubInvite.update({
      where: { id: invite.id },
      data: {
        currentUses: { increment: 1 }
      }
    });

    console.log(`✅ User ${userId} joined bookclub ${bookClub.name} via invite ${code}`);
    res.json({ 
      success: true, 
      message: 'Successfully joined book club',
      bookClub: {
        id: bookClub.id,
        name: bookClub.name,
        imageUrl: bookClub.imageUrl
      }
    });
  } catch (error) {
    console.error('Error joining via invite:', error);
    res.status(500).json({ error: 'Failed to join book club' });
  }
};

// Get invite info (public)
export const getInviteInfo = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const invite = await prisma.bookClubInvite.findUnique({
      where: { code }
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Check if expired
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return res.status(400).json({ error: 'This invite has expired' });
    }

    // Check if max uses reached
    if (invite.maxUses && invite.currentUses >= invite.maxUses) {
      return res.status(400).json({ error: 'This invite has reached its maximum uses' });
    }

    const bookClub = await prisma.bookClub.findUnique({
      where: { id: invite.bookClubId }
    });

    if (!bookClub) {
      return res.status(404).json({ error: 'Book club not found' });
    }

    res.json({
      success: true,
      bookClub: {
        id: bookClub.id,
        name: bookClub.name,
        imageUrl: bookClub.imageUrl,
        category: bookClub.category,
        memberCount: bookClub.members.length + 1 // +1 for creator
      },
      invite: {
        expiresAt: invite.expiresAt,
        maxUses: invite.maxUses,
        currentUses: invite.currentUses
      }
    });
  } catch (error) {
    console.error('Error fetching invite info:', error);
    res.status(500).json({ error: 'Failed to fetch invite info' });
  }
};
