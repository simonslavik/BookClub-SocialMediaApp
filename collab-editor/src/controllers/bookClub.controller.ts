import { Request, Response } from 'express';
import { BookClubService } from '../services/bookClub.service.js';
import logger from '../utils/logger.js';
import prisma from '../config/database.js';

export class BookClubController {
  /**
   * Discover bookclubs (public endpoint)
   */
  static async discoverClubs(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId; // Optional - from optionalAuth middleware
      const { category } = req.query;

      const clubs = await BookClubService.discoverClubs(
        userId,
        category as string | undefined
      );

      // Fetch current books for all clubs from books-service
      const clubIds = clubs.map(c => c.id);
      const booksMap = new Map<string, any>();

      if (clubIds.length > 0) {
        try {
          const booksResponse = await fetch(
            `${process.env.BOOKS_SERVICE_URL || 'http://books-service:3002'}/bookclub/batch-current-books`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bookClubIds: clubIds })
            }
          );

          if (booksResponse.ok) {
            const booksData = await booksResponse.json();
            if (booksData.success && Array.isArray(booksData.currentBooks)) {
              booksData.currentBooks.forEach((item: any) => {
                if (item.currentBook) {
                  booksMap.set(item.bookClubId, item.currentBook);
                }
              });
            }
          }
        } catch (error) {
          logger.error('Failed to fetch current books', { error });
        }
      }

      // Enhance clubs with current book data
      const enhancedClubs = clubs.map(club => ({
        ...club,
        currentBook: booksMap.get(club.id) || null
      }));

      res.json({ success: true, data: enhancedClubs });
    } catch (error: any) {
      logger.error('ERROR_DISCOVER_CLUBS', { error: error.message });
      res.status(500).json({ success: false, message: 'Failed to discover clubs' });
    }
  }

  /**
   * Get club preview (public endpoint for PUBLIC/PRIVATE clubs)
   */
  static async getClubPreview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      logger.info('GET_CLUB_PREVIEW', { 
        clubId: id, 
        userId, 
        hasUser: !!(req as any).user,
        userObject: (req as any).user,
        authHeader: req.headers.authorization ? 'present' : 'missing'
      });

      const preview = await BookClubService.getClubPreview(id, userId);

      logger.info('PREVIEW_RESULT', { clubId: id, isMember: preview.isMember, creatorId: preview.creatorId });

      res.json({ success: true, data: preview });
    } catch (error: any) {
      if (error.message === 'CLUB_NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Club not found' });
      }
      logger.error('ERROR_GET_CLUB_PREVIEW', { error: error.message, clubId: req.params.id });
      res.status(500).json({ success: false, message: 'Failed to get club preview' });
    }
  }

  /**
   * Get full club details (members only)
   */
  static async getClub(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const club = await BookClubService.getClub(id, userId);

      res.json({ success: true, data: club });
    } catch (error: any) {
      if (error.message === 'CLUB_NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Club not found' });
      }
      if (error.message === 'ACCESS_DENIED') {
        return res.status(403).json({ success: false, message: 'You must be a member to view this club' });
      }
      logger.error('ERROR_GET_CLUB', { error: error.message, clubId: req.params.id });
      res.status(500).json({ success: false, message: 'Failed to get club' });
    }
  }

  /**
   * Create a new bookclub
   */
  static async createClub(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { name, description, imageUrl, category, visibility, requiresApproval } = req.body;

      const club = await BookClubService.createClub(userId, {
        name,
        description,
        imageUrl,
        category,
        visibility,
        requiresApproval
      });

      res.status(201).json({ success: true, data: club });
    } catch (error: any) {
      logger.error('ERROR_CREATE_CLUB', { error: error.message, userId: (req as any).user.userId });
      res.status(500).json({ success: false, message: 'Failed to create club' });
    }
  }

  /**
   * Join a PUBLIC club instantly
   */
  static async joinClub(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const member = await BookClubService.joinClub(id, userId);

      res.json({ success: true, data: member });
    } catch (error: any) {
      if (error.message === 'CLUB_NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Club not found' });
      }
      if (error.message === 'ALREADY_MEMBER') {
        return res.status(400).json({ success: false, message: 'Already a member of this club' });
      }
      if (error.message === 'BANNED_FROM_CLUB') {
        return res.status(403).json({ success: false, message: 'You are banned from this club' });
      }
      if (error.message === 'REQUIRES_APPROVAL') {
        return res.status(400).json({ success: false, message: 'This club requires approval to join' });
      }
      logger.error('ERROR_JOIN_CLUB', { error: error.message, clubId: id });
      res.status(500).json({ success: false, message: 'Failed to join club' });
    }
  }

  /**
   * Request to join a PRIVATE club
   */
  static async requestToJoin(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;
      const { message } = req.body;

      const request = await BookClubService.requestToJoin(id, userId, message);

      res.status(201).json({ success: true, data: request });
    } catch (error: any) {
      if (error.message === 'CLUB_NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Club not found' });
      }
      if (error.message === 'REQUEST_ALREADY_PENDING') {
        return res.status(400).json({ success: false, message: 'You already have a pending request' });
      }
      if (error.message === 'PUBLIC_CLUB_NO_REQUEST_NEEDED') {
        return res.status(400).json({ success: false, message: 'This is a public club, you can join directly' });
      }
      if (error.message === 'INVITE_ONLY_CLUB') {
        return res.status(400).json({ success: false, message: 'This club is invite-only' });
      }
      logger.error('ERROR_REQUEST_JOIN', { error: error.message, clubId: id });
      res.status(500).json({ success: false, message: 'Failed to send join request' });
    }
  }

  /**
   * Get pending requests (Admin/Owner only)
   */
  static async getPendingRequests(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const requests = await BookClubService.getPendingRequests(id, userId);

      res.json({ success: true, data: requests });
    } catch (error: any) {
      if (error.message === 'INSUFFICIENT_PERMISSIONS') {
        return res.status(403).json({ success: false, message: 'You do not have permission to view requests' });
      }
      logger.error('ERROR_GET_REQUESTS', { error: error.message, clubId: req.params.id });
      res.status(500).json({ success: false, message: 'Failed to get requests' });
    }
  }

  /**
   * Approve membership request (Admin/Owner only)
   */
  static async approveRequest(req: Request, res: Response) {
    try {
      const { id, requestId } = req.params;
      const userId = (req as any).user.userId;

      const result = await BookClubService.approveRequest(id, requestId, userId);

      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === 'REQUEST_NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }
      if (error.message === 'REQUEST_ALREADY_REVIEWED') {
        return res.status(400).json({ success: false, message: 'Request already reviewed' });
      }
      if (error.message === 'INSUFFICIENT_PERMISSIONS') {
        return res.status(403).json({ success: false, message: 'You do not have permission to approve requests' });
      }
      logger.error('ERROR_APPROVE_REQUEST', { error: error.message, clubId: id, requestId });
      res.status(500).json({ success: false, message: 'Failed to approve request' });
    }
  }

  /**
   * Reject membership request (Admin/Owner only)
   */
  static async rejectRequest(req: Request, res: Response) {
    try {
      const { id, requestId } = req.params;
      const userId = (req as any).user.userId;

      const result = await BookClubService.rejectRequest(id, requestId, userId);

      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === 'REQUEST_NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }
      if (error.message === 'REQUEST_ALREADY_REVIEWED') {
        return res.status(400).json({ success: false, message: 'Request already reviewed' });
      }
      if (error.message === 'INSUFFICIENT_PERMISSIONS') {
        return res.status(403).json({ success: false, message: 'You do not have permission to reject requests' });
      }
      logger.error('ERROR_REJECT_REQUEST', { error: error.message, clubId: id, requestId });
      res.status(500).json({ success: false, message: 'Failed to reject request' });
    }
  }

  /**
   * Leave club
   */
  static async leaveClub(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const result = await BookClubService.leaveClub(id, userId);

      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === 'NOT_A_MEMBER') {
        return res.status(400).json({ success: false, message: 'You are not a member of this club' });
      }
      if (error.message === 'OWNER_MUST_TRANSFER_OWNERSHIP') {
        return res.status(400).json({ success: false, message: 'You must transfer ownership before leaving' });
      }
      logger.error('ERROR_LEAVE_CLUB', { error: error.message, clubId: id });
      res.status(500).json({ success: false, message: 'Failed to leave club' });
    }
  }

  /**
   * Create invite link (Admin/Owner only)
   */
  static async createInvite(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;
      const { maxUses, expiresInDays } = req.body;

      const invite = await BookClubService.createInvite(id, userId, maxUses, expiresInDays);

      res.status(201).json({ success: true, data: invite });
    } catch (error: any) {
      if (error.message === 'INSUFFICIENT_PERMISSIONS') {
        return res.status(403).json({ success: false, message: 'You do not have permission to create invites' });
      }
      logger.error('ERROR_CREATE_INVITE', { error: error.message, clubId: id });
      res.status(500).json({ success: false, message: 'Failed to create invite' });
    }
  }

  /**
   * Get all invites (Admin/Owner only)
   */
  static async getInvites(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const invites = await BookClubService.getInvites(id, userId);

      res.json({ success: true, data: invites });
    } catch (error: any) {
      if (error.message === 'INSUFFICIENT_PERMISSIONS') {
        return res.status(403).json({ success: false, message: 'You do not have permission to view invites' });
      }
      logger.error('ERROR_GET_INVITES', { error: error.message, clubId: id });
      res.status(500).json({ success: false, message: 'Failed to get invites' });
    }
  }

  /**
   * Get shareable invite (Any member)
   */
  static async getShareableInvite(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const invite = await BookClubService.getShareableInvite(id, userId);

      if (!invite) {
        return res.status(404).json({ success: false, message: 'No active invite found' });
      }

      res.json({ success: true, data: invite });
    } catch (error: any) {
      if (error.message === 'INSUFFICIENT_PERMISSIONS') {
        return res.status(403).json({ success: false, message: 'You must be a member to get invite links' });
      }
      logger.error('ERROR_GET_SHAREABLE_INVITE', { error: error.message, clubId: id });
      res.status(500).json({ success: false, message: 'Failed to get invite' });
    }
  }

  /**
   * Delete invite (Admin/Owner only)
   */
  static async deleteInvite(req: Request, res: Response) {
    try {
      const { id, inviteId } = req.params;
      const userId = (req as any).user.userId;

      const result = await BookClubService.deleteInvite(id, inviteId, userId);

      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === 'INVITE_NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Invite not found' });
      }
      if (error.message === 'INSUFFICIENT_PERMISSIONS') {
        return res.status(403).json({ success: false, message: 'You do not have permission to delete invites' });
      }
      logger.error('ERROR_DELETE_INVITE', { error: error.message, clubId: id, inviteId });
      res.status(500).json({ success: false, message: 'Failed to delete invite' });
    }
  }

  /**
   * Join via invite code (public endpoint)
   */
  static async joinByInvite(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const userId = (req as any).user.userId;

      const result = await BookClubService.joinByInvite(code, userId);

      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === 'INVALID_INVITE') {
        return res.status(404).json({ success: false, message: 'Invalid invite code' });
      }
      if (error.message === 'INVITE_EXPIRED') {
        return res.status(400).json({ success: false, message: 'This invite has expired' });
      }
      if (error.message === 'INVITE_MAX_USES_REACHED') {
        return res.status(400).json({ success: false, message: 'This invite has reached its maximum uses' });
      }
      if (error.message === 'ALREADY_MEMBER') {
        return res.status(400).json({ success: false, message: 'Already a member of this club' });
      }
      if (error.message === 'BANNED_FROM_CLUB') {
        return res.status(403).json({ success: false, message: 'You are banned from this club' });
      }
      logger.error('ERROR_JOIN_BY_INVITE', { error: error.message, code });
      res.status(500).json({ success: false, message: 'Failed to join via invite' });
    }
  }

  /**
   * Remove member (Admin/Owner only)
   */
  static async removeMember(req: Request, res: Response) {
    try {
      const { id, userId: targetUserId } = req.params;
      const userId = (req as any).user.userId;

      const result = await BookClubService.removeMember(id, targetUserId, userId);

      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === 'MEMBER_NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Member not found' });
      }
      if (error.message === 'CANNOT_REMOVE_OWNER') {
        return res.status(400).json({ success: false, message: 'Cannot remove the owner' });
      }
      if (error.message === 'INSUFFICIENT_PERMISSIONS') {
        return res.status(403).json({ success: false, message: 'You do not have permission to remove members' });
      }
      logger.error('ERROR_REMOVE_MEMBER', { error: error.message, clubId: id });
      res.status(500).json({ success: false, message: 'Failed to remove member' });
    }
  }

  /**
   * Update member role (Owner only)
   */
  static async updateMemberRole(req: Request, res: Response) {
    try {
      const { id, userId: targetUserId } = req.params;
      const userId = (req as any).user.userId;
      const { role } = req.body;

      const result = await BookClubService.updateMemberRole(id, targetUserId, role, userId);

      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === 'MEMBER_NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Member not found' });
      }
      if (error.message === 'CANNOT_CHANGE_OWNER_ROLE') {
        return res.status(400).json({ success: false, message: 'Cannot change owner role' });
      }
      if (error.message === 'INSUFFICIENT_PERMISSIONS') {
        return res.status(403).json({ success: false, message: 'You do not have permission to change roles' });
      }
      logger.error('ERROR_UPDATE_ROLE', { error: error.message, clubId: id });
      res.status(500).json({ success: false, message: 'Failed to update role' });
    }
  }

  /**
   * Update club settings (Admin/Owner only)
   */
  static async updateClub(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;
      const { name, description, imageUrl, category, visibility, requiresApproval } = req.body;

      const club = await BookClubService.updateClub(id, userId, {
        name,
        description,
        imageUrl,
        category,
        visibility,
        requiresApproval
      });

      res.json({ success: true, data: club });
    } catch (error: any) {
      if (error.message === 'INSUFFICIENT_PERMISSIONS') {
        return res.status(403).json({ success: false, message: 'You do not have permission to update this club' });
      }
      logger.error('ERROR_UPDATE_CLUB', { error: error.message, clubId: id });
      res.status(500).json({ success: false, message: 'Failed to update club' });
    }
  }

  /**
   * Delete club (Owner only)
   */
  static async deleteClub(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const result = await BookClubService.deleteClub(id, userId);

      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === 'INSUFFICIENT_PERMISSIONS') {
        return res.status(403).json({ success: false, message: 'Only the owner can delete this club' });
      }
      logger.error('ERROR_DELETE_CLUB', { error: error.message, clubId: id });
      res.status(500).json({ success: false, message: 'Failed to delete club' });
    }
  }

  /**
   * Verify member role (for inter-service communication)
   */
  static async verifyMemberRole(req: Request, res: Response) {
    try {
      const { id, userId } = req.params;
      
      logger.info('VERIFY_ROLE_REQUEST', { clubId: id, userId });

      // First check if user is the creator (they automatically have OWNER role)
      const bookClub = await prisma.bookClub.findUnique({
        where: { id },
        select: { creatorId: true }
      });
      
      logger.info('BOOKCLUB_LOOKUP', { found: !!bookClub, creatorId: bookClub?.creatorId });
      
      if (!bookClub) {
        logger.warn('BOOKCLUB_NOT_FOUND', { clubId: id });
        return res.status(404).json({ success: false, message: 'Book club not found' });
      }

      if (bookClub.creatorId === userId) {
        logger.info('USER_IS_CREATOR', { userId, clubId: id });
        return res.json({ 
          success: true, 
          role: 'OWNER', 
          status: 'ACTIVE' 
        });
      }

      // Otherwise check membership table
      const membership = await BookClubService.getMembership(id, userId);
      
      logger.info('MEMBERSHIP_LOOKUP', { found: !!membership, role: membership?.role });

      if (!membership) {
        logger.warn('MEMBER_NOT_FOUND', { userId, clubId: id });
        return res.status(404).json({ success: false, message: 'Member not found' });
      }

      res.json({ 
        success: true, 
        role: membership.role, 
        status: membership.status 
      });
    } catch (error: any) {
      logger.error('ERROR_VERIFY_ROLE', { error: error.message, stack: error.stack, clubId: req.params.id });
      res.status(500).json({ success: false, message: 'Failed to verify role' });
    }
  }
}

