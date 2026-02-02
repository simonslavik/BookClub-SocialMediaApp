import { Request, Response } from 'express';
import { DirectMessageService } from '../services/directMessage.service.js';
import { logger, logError } from '../utils/logger.js';
import { UnauthorizedError, BadRequestError, ForbiddenError } from '../utils/errors.js';

/**
 * Get direct message conversation between two users
 */
export const getDirectMessages = async (req: Request, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const { otherUserId } = req.params;

        if (!currentUserId) {
            throw new UnauthorizedError('User not authenticated');
        }

        if (!otherUserId) {
            throw new BadRequestError('Other user ID is required');
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = (page - 1) * limit;

        const messages = await DirectMessageService.getConversation(
            currentUserId,
            otherUserId,
            limit,
            offset
        );

        // Get total count for pagination
        const totalCount = messages.length; // Note: This is an approximation, could enhance service to return actual total

        const totalPages = Math.ceil(totalCount / limit);

        return res.status(200).json({
            success: true,
            data: messages,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
                hasMore: messages.length === limit
            }
        });
    } catch (error: any) {
        if (error instanceof ForbiddenError || error instanceof BadRequestError) {
            throw error;
        }
        logError(error, 'Get direct messages error', { 
            userId: req.user?.userId,
            otherUserId: req.params.otherUserId
        });
        throw error;
    }
};

/**
 * Send a direct message
 */
export const sendDirectMessage = async (req: Request, res: Response) => {
    try {
        const currentUserId = req.user?.userId || req.headers['x-user-id'] as string;
        const { receiverId, content, attachments = [] } = req.body;

        if (!currentUserId) {
            throw new UnauthorizedError('User not authenticated');
        }

        const message = await DirectMessageService.sendMessage(
            currentUserId,
            receiverId,
            content?.trim() || '',
            attachments
        );

        logger.info({
            type: 'DM_SENT',
            senderId: currentUserId,
            receiverId,
            messageId: message.id,
            hasAttachments: attachments.length > 0
        });

        return res.status(200).json({
            success: true,
            data: message
        });
    } catch (error: any) {
        if (error instanceof ForbiddenError) {
            throw error;
        }
        logError(error, 'Send direct message error', { 
            senderId: req.user?.userId || req.headers['x-user-id'],
            receiverId: req.body.receiverId
        });
        throw error;
    }
};

/**
 * Get all DM conversations for current user
 */
export const getConversations = async (req: Request, res: Response) => {
    try {
        const currentUserId = req.user?.userId;

        if (!currentUserId) {
            throw new UnauthorizedError('User not authenticated');
        }

        const conversations = await DirectMessageService.getUserConversations(currentUserId);

        return res.status(200).json({
            success: true,
            data: conversations
        });
    } catch (error: any) {
        logError(error, 'Get conversations error', { userId: req.user?.userId });
        throw error;
    }
};
