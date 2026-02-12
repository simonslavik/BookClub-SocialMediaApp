import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { InviteService } from '../services/invite.service.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

// Get invite for a bookclub
export const getInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId } = req.params;
    const userId = req.user!.userId;

    const invite = await InviteService.getInvite(bookClubId, userId);

    res.json({ success: true, invite });
  } catch (error: any) {
    logger.error('ERROR_FETCH_INVITE', { error: error.message });
    let statusCode = 500;
    if (error.message === 'Book club not found') statusCode = 404;
    if (error.message === 'Only book club members can view invite') statusCode = 403;
    res.status(statusCode).json({ error: error.message || 'Failed to fetch invite' });
  }
};

// Join bookclub via invite code
export const joinViaInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;
    const userId = req.user!.userId;

    const bookClub = await InviteService.joinViaInvite(code, userId);

    res.json({ 
      success: true, 
      message: 'Successfully joined book club',
      bookClub: {
        id: bookClub.id,
        name: bookClub.name,
        imageUrl: bookClub.imageUrl
      }
    });
  } catch (error: any) {
    logger.error('ERROR_JOIN_VIA_INVITE', { error: error.message });
    let statusCode = 500;
    if (error.message === 'Invalid invite code' || error.message === 'Book club not found') statusCode = 404;
    if (error.message.includes('expired') || error.message.includes('maximum uses') || error.message.includes('already a member')) statusCode = 400;
    res.status(statusCode).json({ error: error.message || 'Failed to join book club' });
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
      where: { id: invite.bookClubId },
      include: { members: { where: { status: 'ACTIVE' } } }
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
        memberCount: bookClub.members?.length || 0
      },
      invite: {
        expiresAt: invite.expiresAt,
        maxUses: invite.maxUses,
        currentUses: invite.currentUses
      }
    });
  } catch (error: any) {
    logger.error('ERROR_FETCH_INVITE_INFO', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch invite info' });
  }
};
