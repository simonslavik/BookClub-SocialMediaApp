import { Request, Response } from 'express';
import { UserService } from '../services/user.service.js';
import { FriendshipService } from '../services/friendship.service.js';
import prisma from '../config/database.js';
import { logger, logError } from '../utils/logger.js';


/**
 * Get current user's profile
 * Requires authentication
 */
export const getProfileById = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user?.userId;

        if (!userId) {
            return res.status(400).json({ 
                message: 'User ID is required' 
            });
        }

        const user = await UserService.getProfile(userId);

        if (!user) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        // If there's a logged-in user and they're viewing someone else's profile, check friendship status
        let friendshipStatus = null;
        if (currentUserId && currentUserId !== userId) {
            const areFriends = await FriendshipService.areFriends(currentUserId, userId);
            if (areFriends) {
                friendshipStatus = 'friends';
            } else {
                // Check for pending requests
                const friendship = await prisma.friendship.findFirst({
                    where: {
                        OR: [
                            { userId: currentUserId, friendId: userId },
                            { userId: userId, friendId: currentUserId }
                        ]
                    }
                });

                if (friendship) {
                    if (friendship.userId === currentUserId) {
                        friendshipStatus = 'request_sent';
                    } else {
                        friendshipStatus = 'request_received';
                    }
                }
            }
        }

        const numberOfFriends = await prisma.friendship.count({
            where: {
                OR: [
                    { userId: userId },
                    { friendId: userId }
                ],
                status: 'ACCEPTED'
            }
        });

        logger.info({
            type: 'PROFILE_VIEWED',
            viewedUserId: userId,
            viewerUserId: currentUserId,
            friendshipStatus
        });

        return res.status(200).json({
            success: true,
            data: {
                ...user,
                friendshipStatus,
                numberOfFriends
            }
        });
    } catch (error: any) {
        logError(error, 'Get profile error', { userId: req.params.userId });
        return res.status(500).json({ 
            message: 'Failed to fetch profile'
        });
    }
};

/**
 * Update current user's profile
 * Requires authentication
 */
export const updateMyProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { name } = req.body;

        if (!userId) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }

        // Validate input
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ 
                message: 'Name is required' 
            });
        }

        const updatedUser = await UserService.updateProfile(userId, { name: name.trim() });

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error: any) {
        logError(error, 'Update profile error', { userId: req.user?.userId });
        return res.status(500).json({ 
            message: 'Failed to update profile'
        });
    }
};

/**
 * Get any user's profile by ID (admin only)
 * Requires authentication and ADMIN role
 */
export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const user = await UserService.getProfile(id);

        if (!user) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (error: any) {
        logError(error, 'Get user error', { userId: req.params.userId });
        return res.status(500).json({ 
            message: 'Failed to fetch user'
        });
    }
};

/**
 * List all users (admin only)
 * Requires authentication and ADMIN role
 */
export const listUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                profileImage: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error: any) {
        logError(error, 'List users error');
        return res.status(500).json({ 
            message: 'Failed to fetch users'
        });
    }
};

/**
 * Get multiple users by IDs (batch endpoint)
 * No authentication required - used by other services
 */
export const getUsersByIds = async (req: Request, res: Response) => {
    try {
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ 
                message: 'userIds must be a non-empty array' 
            });
        }

        const users = await UserService.getUsersByIds(userIds);

        return res.status(200).json({
            success: true,
            users: users.map(user => ({
                id: user.id,
                username: user.name,
                email: user.email,
                profileImage: user.profileImage
            }))
        });
    } catch (error: any) {
        logError(error, 'Batch get users error', { userIds: req.query.userIds });
        return res.status(500).json({ 
            message: 'Failed to fetch users'
        });
    }
};
