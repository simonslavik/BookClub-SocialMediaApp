import { FriendshipService } from '../services/friendship.service.js';
import { logger, logError } from '../utils/logger.js';
export const sendFriendRequest = async (req, res) => {
    try {
        const { recipientId } = req.body;
        const senderId = req.user?.userId;
        if (!senderId) {
            return res.status(401).json({
                message: 'User not authenticated'
            });
        }
        const result = await FriendshipService.sendFriendRequest(senderId, recipientId);
        // Check if result contains message (auto-accepted) or is just the friendship
        const friendshipId = 'id' in result ? result.id : result.friendship?.id;
        logger.info({
            type: 'FRIEND_REQUEST_SENT',
            senderId,
            recipientId,
            friendshipId
        });
        return res.status(200).json({
            success: true,
            message: 'message' in result ? result.message : 'Friend request sent successfully',
            data: 'id' in result ? result : result.friendship
        });
    }
    catch (error) {
        if (error.message === 'CANNOT_ADD_YOURSELF') {
            logger.warn({
                type: 'VALIDATION_ERROR',
                action: 'SEND_FRIEND_REQUEST',
                senderId: req.user?.userId,
                error: 'Cannot send friend request to yourself'
            });
            return res.status(400).json({
                message: 'Cannot send friend request to yourself'
            });
        }
        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({
                message: 'User not found'
            });
        }
        if (error.message === 'ALREADY_FRIENDS' || error.message === 'REQUEST_ALREADY_SENT') {
            logger.warn({
                type: 'FRIEND_REQUEST_DUPLICATE',
                action: 'SEND_FRIEND_REQUEST',
                senderId: req.user?.userId,
                recipientId: req.body.recipientId
            });
            return res.status(400).json({
                message: error.message === 'REQUEST_ALREADY_SENT'
                    ? 'Friend request already sent'
                    : 'Already friends'
            });
        }
        logError(error, 'Send friend request error', { senderId: req.user?.userId, recipientId: req.body.recipientId });
        return res.status(500).json({
            message: 'Failed to send friend request'
        });
    }
};
export const acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                message: 'User not authenticated'
            });
        }
        const updatedFriendship = await FriendshipService.acceptFriendRequest(userId, requestId);
        logger.info({
            type: 'FRIEND_REQUEST_ACCEPTED',
            requestId,
            accepterId: userId
        });
        return res.status(200).json({
            success: true,
            message: 'Friend request accepted',
            data: updatedFriendship
        });
    }
    catch (error) {
        if (error.message === 'FRIENDSHIP_NOT_FOUND') {
            return res.status(404).json({
                message: 'Friend request not found'
            });
        }
        if (error.message === 'INVALID_STATUS') {
            return res.status(400).json({
                message: 'Friend request is not pending'
            });
        }
        logError(error, 'Accept friend request error', { requestId: req.body.requestId, userId: req.user?.userId });
        return res.status(500).json({
            message: 'Failed to accept friend request'
        });
    }
};
export const rejectFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                message: 'User not authenticated'
            });
        }
        await FriendshipService.rejectFriendRequest(userId, requestId);
        return res.status(200).json({
            success: true,
            message: 'Friend request rejected successfully'
        });
    }
    catch (error) {
        if (error.message === 'FRIENDSHIP_NOT_FOUND') {
            return res.status(404).json({
                message: 'Friend request not found'
            });
        }
        if (error.message === 'INVALID_STATUS') {
            return res.status(400).json({
                message: 'Friend request is not pending'
            });
        }
        logError(error, 'Reject friend request error', { userId: req.user?.userId, requestId: req.body.requestId });
        return res.status(500).json({
            message: 'Failed to reject friend request'
        });
    }
};
export const removeFriend = async (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                message: 'User not authenticated'
            });
        }
        await FriendshipService.removeFriend(userId, friendId);
        return res.status(200).json({
            success: true,
            message: 'Friend removed successfully'
        });
    }
    catch (error) {
        if (error.message === 'FRIENDSHIP_NOT_FOUND') {
            return res.status(404).json({
                message: 'Friendship not found'
            });
        }
        logError(error, 'Remove friend error', { userId: req.user?.userId, friendId: req.body.friendId });
        return res.status(500).json({
            message: 'Failed to remove friend'
        });
    }
};
export const listFriends = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                message: 'User not authenticated'
            });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const { friends, totalCount } = await FriendshipService.getFriends(userId, page, limit);
        const totalPages = Math.ceil(totalCount / limit);
        return res.status(200).json({
            success: true,
            data: friends,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
                hasMore: page < totalPages
            }
        });
    }
    catch (error) {
        logError(error, 'List friends error', { userId: req.user?.userId });
        return res.status(500).json({
            message: 'Failed to list friends'
        });
    }
};
export const listFriendRequests = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                message: 'User not authenticated'
            });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const { requests, totalCount } = await FriendshipService.getPendingRequests(userId, page, limit);
        const totalPages = Math.ceil(totalCount / limit);
        return res.status(200).json({
            success: true,
            data: requests,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
                hasMore: page < totalPages
            }
        });
    }
    catch (error) {
        logError(error, 'List friend requests error', { userId: req.user?.userId });
        return res.status(500).json({
            message: 'Failed to list friend requests'
        });
    }
};
//# sourceMappingURL=friendsController.js.map