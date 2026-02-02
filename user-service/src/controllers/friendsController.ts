import { Request, Response } from 'express';
import prisma from '../config/database.js';
import { logger, logError } from '../utils/logger.js';

export const sendFriendRequest = async (req: Request, res: Response) => {
    try {
        // Request body is already validated by middleware
        const { recipientId } = req.body;
        const senderId = req.user?.userId;
        
        if (!senderId) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }

        if (senderId === recipientId) {
            logger.warn({
                type: 'VALIDATION_ERROR',
                action: 'SEND_FRIEND_REQUEST',
                senderId,
                error: 'Cannot send friend request to yourself'
            });
            return res.status(400).json({ 
                message: 'Cannot send friend request to yourself' 
            });
        }

        // Check if users exist
        const recipient = await prisma.user.findUnique({ where: { id: recipientId } });

        if (!recipient) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        // Check if friendship already exists (in either direction)
        const existingFriendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId: senderId, friendId: recipientId },
                    { userId: recipientId, friendId: senderId }
                ]
            }
        });

        if (existingFriendship) {
            logger.warn({
                type: 'FRIEND_REQUEST_DUPLICATE',
                action: 'SEND_FRIEND_REQUEST',
                senderId,
                recipientId,
                status: existingFriendship.status
            });
            return res.status(400).json({ 
                message: existingFriendship.status === 'PENDING' 
                    ? 'Friend request already sent' 
                    : 'Already friends'
            });
        }

        // Create friend request
        const friendship = await prisma.friendship.create({
            data: {
                userId: senderId,
                friendId: recipientId,
                status: 'PENDING'
            },
            include: {
                friend: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true
                    }
                }
            }
        });

        logger.info({
            type: 'FRIEND_REQUEST_SENT',
            senderId,
            recipientId,
            friendshipId: friendship.id
        });

        return res.status(200).json({
            success: true,
            message: 'Friend request sent successfully',
            data: friendship
        });
    } catch (error: any) {
        logError(error, 'Send friend request error', { senderId: req.user?.userId, recipientId: req.body.recipientId });
        return res.status(500).json({ 
            message: 'Failed to send friend request'
        });
    }
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
    try {
        // Request body is already validated by middleware
        const { requestId } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }

        // Find the friendship request
        const friendship = await prisma.friendship.findUnique({
            where: { id: requestId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true
                    }
                }
            }
        });

        if (!friendship || friendship.friendId !== userId) {
            return res.status(404).json({ 
                message: 'Friend request not found' 
            });
        }

        if (friendship.status !== 'PENDING') {
            return res.status(400).json({ 
                message: 'Friend request is not pending' 
            });
        }

        // Update the friendship status to accepted
        const updatedFriendship = await prisma.friendship.update({
            where: { id: requestId },
            data: { status: 'ACCEPTED' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true
                    }
                }
            }
        });

        logger.info({
            type: 'FRIEND_REQUEST_ACCEPTED',
            userId,
            senderId: updatedFriendship.userId,
            friendshipId: requestId
        });

        return res.status(200).json({
            success: true,
            message: 'Friend request accepted successfully',
            data: updatedFriendship
        });
    } catch (error: any) {
        logError(error, 'Accept friend request error', { userId: req.user?.userId, requestId: req.body.requestId });
        return res.status(500).json({ 
            message: 'Failed to accept friend request'
        });
    }  
};

export const rejectFriendRequest = async (req: Request, res: Response) => {
    try {
        // Request body is already validated by middleware
        const { requestId } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }

        // Find the friendship request
        const friendship = await prisma.friendship.findUnique({
            where: { id: requestId }
        });

        if (!friendship || friendship.friendId !== userId) {
            return res.status(404).json({ 
                message: 'Friend request not found' 
            });
        }

        if (friendship.status !== 'PENDING') {
            return res.status(400).json({ 
                message: 'Friend request is not pending' 
            });
        }

        // Delete the friendship request instead of updating status
        await prisma.friendship.delete({
            where: { id: requestId }
        });

        return res.status(200).json({
            success: true,
            message: 'Friend request rejected successfully'
        });
    } catch (error: any) {
        logError(error, 'Reject friend request error', { userId: req.user?.userId, requestId: req.body.requestId });
        return res.status(500).json({ 
            message: 'Failed to reject friend request'
        });
    }  
};

export const removeFriend = async (req: Request, res: Response) => {
    try {
        // Request body is already validated by middleware
        const { friendId } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }

        // Delete friendship (check both directions)
        const deleted = await prisma.friendship.deleteMany({
            where: {
                OR: [
                    { userId: userId, friendId: friendId, status: 'ACCEPTED' },
                    { userId: friendId, friendId: userId, status: 'ACCEPTED' }
                ]
            }
        });

        if (deleted.count === 0) {
            return res.status(404).json({ 
                message: 'Friendship not found' 
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Friend removed successfully'
        });
    } catch (error: any) {
        logError(error, 'Remove friend error', { userId: req.user?.userId, friendId: req.body.friendId });
        return res.status(500).json({ 
            message: 'Failed to remove friend'
        });
    }
};

export const listFriends = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }

        // Parse pagination params (already validated by middleware)
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        // Get total count for pagination metadata
        const totalCount = await prisma.friendship.count({
            where: {
                OR: [
                    { userId: userId, status: 'ACCEPTED' },
                    { friendId: userId, status: 'ACCEPTED' }
                ]
            }
        });

        // Fetch accepted friendships with pagination
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { userId: userId, status: 'ACCEPTED' },
                    { friendId: userId, status: 'ACCEPTED' }
                ]
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true
                    }
                },
                friend: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true
                    }
                }
            }
        });

        // Extract friend data (the user who is not the current user)
        const friends = friendships.map(f => 
            f.userId === userId ? f.friend : f.user
        );

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
    } catch (error: any) {
        logError(error, 'List friends error', { userId: req.user?.userId });
        return res.status(500).json({ 
            message: 'Failed to list friends'
        });
    }
};

export const listFriendRequests = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }

        // Parse pagination params (already validated by middleware)
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        // Get total count for pagination metadata
        const totalCount = await prisma.friendship.count({
            where: {
                friendId: userId,
                status: 'PENDING'
            }
        });

        // Fetch pending friend requests with pagination
        const friendRequests = await prisma.friendship.findMany({
            where: {
                friendId: userId,
                status: 'PENDING'
            },
            skip,
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const totalPages = Math.ceil(totalCount / limit);

        return res.status(200).json({
            success: true,
            data: friendRequests,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
                hasMore: page < totalPages
            }
        });

    } catch (error: any) {
        logError(error, 'List friend requests error', { userId: req.user?.userId });
        return res.status(500).json({ 
            message: 'Failed to list friend requests'
        });
    }
};
