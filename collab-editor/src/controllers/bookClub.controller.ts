import { Request, Response } from 'express';
import { BookClubService } from '../services/bookClub.service.js';
import logger from '../utils/logger.js';

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

      res.json({ success: true, data: clubs });
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

      const preview = await BookClubService.getClubPreview(id, userId);

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
}
