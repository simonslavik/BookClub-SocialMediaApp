import { DirectMessageService } from '../services/directMessage.service.js';
import { logger, logError } from '../utils/logger.js';
import { UnauthorizedError, BadRequestError, ForbiddenError } from '../utils/errors.js';
/**
 * Get direct message conversation between two users
 */
export const getDirectMessages = async (req, res) => {
    try {
        const currentUserId = req.user?.userId;
        const { otherUserId } = req.params;
        if (!currentUserId) {
            throw new UnauthorizedError('User not authenticated');
        }
        if (!otherUserId) {
            throw new BadRequestError('Other user ID is required');
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const result = await DirectMessageService.getConversation(currentUserId, otherUserId, page, limit);
        const totalPages = Math.ceil(result.totalCount / limit);
        return res.status(200).json({
            success: true,
            data: result.messages,
            pagination: {
                page,
                limit,
                totalCount: result.totalCount,
                totalPages,
                hasMore: page < totalPages
            }
        });
    }
    catch (error) {
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
export const sendDirectMessage = async (req, res) => {
    try {
        const currentUserId = req.user?.userId || req.headers['x-user-id'];
        const { receiverId, content, attachments = [] } = req.body;
        if (!currentUserId) {
            throw new UnauthorizedError('User not authenticated');
        }
        const message = await DirectMessageService.sendMessage(currentUserId, receiverId, content?.trim() || '', attachments);
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
    }
    catch (error) {
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
export const getConversations = async (req, res) => {
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
    }
    catch (error) {
        logError(error, 'Get conversations error', { userId: req.user?.userId });
        throw error;
    }
};
//# sourceMappingURL=directMessagesController.js.map