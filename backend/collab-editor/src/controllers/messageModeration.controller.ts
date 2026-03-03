import { Request, Response } from 'express';
import prisma from '../config/database.js';
import { BookClubService } from '../services/bookclub.service.js';
import { BookClubRole } from '@prisma/client';
import logger from '../utils/logger.js';

export class MessageModerationController {
  /**
   * Delete a message (MODERATOR+ only)
   */
  static async deleteMessage(req: Request, res: Response) {
    try {
      const { messageId } = req.params;
      const userId = (req as any).user.userId;

      // Get message to find bookclub
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { room: true }
      });

      if (!message) {
        return res.status(404).json({ success: false, message: 'Message not found' });
      }

      // Check if user has MODERATOR+ permission
      const hasPermission = await BookClubService.checkPermission(
        message.room.bookClubId,
        userId,
        BookClubRole.MODERATOR
      );

      // Allow users to delete their own messages
      const isOwnMessage = message.userId === userId;

      if (!hasPermission && !isOwnMessage) {
        return res.status(403).json({ 
          success: false, 
          message: 'You need MODERATOR role or higher to delete other users\' messages' 
        });
      }

      // Soft delete: mark as deleted and unpin if pinned
      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          deletedAt: new Date(),
          deletedBy: userId,
          content: '[Message deleted]',
          isPinned: false
        }
      });

      logger.info('MESSAGE_DELETED', { 
        messageId, 
        deletedBy: userId, 
        bookClubId: message.room.bookClubId 
      });

      res.json({ success: true, data: updatedMessage });
    } catch (error: any) {
      logger.error('ERROR_DELETE_MESSAGE', { error: error.message });
      res.status(500).json({ success: false, message: 'Failed to delete message' });
    }
  }

  /**
   * Pin a message (MODERATOR+ only)
   */
  static async pinMessage(req: Request, res: Response) {
    try {
      const { messageId } = req.params;
      const userId = (req as any).user.userId;

      // Get message to find bookclub
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { room: true }
      });

      if (!message) {
        return res.status(404).json({ success: false, message: 'Message not found' });
      }

      if (message.deletedAt) {
        return res.status(400).json({ success: false, message: 'Cannot pin deleted message' });
      }

      // Check if user has MODERATOR+ permission
      const hasPermission = await BookClubService.checkPermission(
        message.room.bookClubId,
        userId,
        BookClubRole.MODERATOR
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          message: 'You need MODERATOR role or higher to pin messages' 
        });
      }

      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: { isPinned: true }
      });

      logger.info('MESSAGE_PINNED', { 
        messageId, 
        pinnedBy: userId, 
        bookClubId: message.room.bookClubId 
      });

      res.json({ success: true, data: updatedMessage });
    } catch (error: any) {
      logger.error('ERROR_PIN_MESSAGE', { error: error.message });
      res.status(500).json({ success: false, message: 'Failed to pin message' });
    }
  }

  /**
   * Unpin a message (MODERATOR+ only)
   */
  static async unpinMessage(req: Request, res: Response) {
    try {
      const { messageId } = req.params;
      const userId = (req as any).user.userId;

      // Get message to find bookclub
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { room: true }
      });

      if (!message) {
        return res.status(404).json({ success: false, message: 'Message not found' });
      }

      // Check if user has MODERATOR+ permission
      const hasPermission = await BookClubService.checkPermission(
        message.room.bookClubId,
        userId,
        BookClubRole.MODERATOR
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          message: 'You need MODERATOR role or higher to unpin messages' 
        });
      }

      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: { isPinned: false }
      });

      logger.info('MESSAGE_UNPINNED', { 
        messageId, 
        unpinnedBy: userId, 
        bookClubId: message.room.bookClubId 
      });

      res.json({ success: true, data: updatedMessage });
    } catch (error: any) {
      logger.error('ERROR_UNPIN_MESSAGE', { error: error.message });
      res.status(500).json({ success: false, message: 'Failed to unpin message' });
    }
  }

  /**
   * Get pinned messages for a room
   */
  static async getPinnedMessages(req: Request, res: Response) {
    try {
      const { roomId } = req.params;

      const pinnedMessages = await prisma.message.findMany({
        where: { 
          roomId,
          isPinned: true,
          deletedAt: null
        },
        include: { attachments: true },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: pinnedMessages });
    } catch (error: any) {
      logger.error('ERROR_GET_PINNED_MESSAGES', { error: error.message });
      res.status(500).json({ success: false, message: 'Failed to get pinned messages' });
    }
  }

  /**
   * Edit a message (own messages only)
   */
  static async editMessage(req: Request, res: Response) {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      const userId = (req as any).user.userId;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Message content is required' });
      }

      if (content.length > 4000) {
        return res.status(400).json({ success: false, message: 'Message content must be at most 4000 characters' });
      }

      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { room: true }
      });

      if (!message) {
        return res.status(404).json({ success: false, message: 'Message not found' });
      }

      if (message.deletedAt) {
        return res.status(400).json({ success: false, message: 'Cannot edit a deleted message' });
      }

      // Only the message author can edit their own message
      if (message.userId !== userId) {
        return res.status(403).json({ success: false, message: 'You can only edit your own messages' });
      }

      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          content: content.trim(),
          editedAt: new Date()
        }
      });

      logger.info('MESSAGE_EDITED', {
        messageId,
        editedBy: userId,
        bookClubId: message.room.bookClubId
      });

      res.json({ success: true, data: updatedMessage });
    } catch (error: any) {
      logger.error('ERROR_EDIT_MESSAGE', { error: error.message });
      res.status(500).json({ success: false, message: 'Failed to edit message' });
    }
  }
}
