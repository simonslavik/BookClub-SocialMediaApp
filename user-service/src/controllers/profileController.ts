import { Request, Response } from 'express';
import { UserService } from '../services/user.service.js';
import { FriendshipService } from '../services/friendship.service.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, BadRequestError, UnauthorizedError } from '../utils/errors.js';


/**
 * Get user's profile by ID
 * Optionally includes friendship status if viewer is authenticated
 */
export const getProfileById = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const currentUserId = req.user?.userId;

    if (!userId) {
        throw new BadRequestError('User ID is required');
    }

    const user = await UserService.getProfile(userId);

    if (!user) {
        throw new NotFoundError('User not found');
    }

    // If there's a logged-in user and they're viewing someone else's profile, check friendship status
    let friendshipStatus = null;
    if (currentUserId && currentUserId !== userId) {
        friendshipStatus = await FriendshipService.getFriendshipStatus(currentUserId, userId);
    }

    const numberOfFriends = await FriendshipService.countFriends(userId);

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
};

/**
 * Update current user's profile
 * Requires authentication
 */
export const updateMyProfile = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { name } = req.body;

    if (!userId) {
        throw new UnauthorizedError('User not authenticated');
    }

    if (!name || name.trim().length === 0) {
        throw new BadRequestError('Name is required');
    }

    const updatedUser = await UserService.updateProfile(userId, { name: name.trim() });

    return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
    });
};

/**
 * Update current user's status
 * Requires authentication
 */
export const updateMyStatus = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { status } = req.body;

    if (!userId) {
        throw new UnauthorizedError('User not authenticated');
    }

    const updatedUser = await UserService.updateStatus(userId, status);

    return res.status(200).json({
        success: true,
        message: 'Status updated successfully',
        data: updatedUser
    });
};

/**
 * Get any user's profile by ID (admin only)
 */
export const getUserById = async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await UserService.getProfile(id);

    if (!user) {
        throw new NotFoundError('User not found');
    }

    return res.status(200).json({
        success: true,
        data: user
    });
};

/**
 * List all users (admin only)
 */
export const listUsers = async (req: Request, res: Response) => {
    const users = await UserService.listAllUsers();

    return res.status(200).json({
        success: true,
        count: users.length,
        data: users
    });
};

/**
 * Search users by name/username
 */
export const searchUsers = async (req: Request, res: Response) => {
    const query = (req.query.q as string || '').trim();
    if (!query) {
        return res.status(200).json({ success: true, data: [] });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const users = await UserService.searchUsers(query, limit);

    return res.status(200).json({
        success: true,
        data: users.map(user => ({
            id: user.id,
            name: user.name,
            username: user.name,
            profileImage: user.profileImage,
            status: user.status
        }))
    });
};

/**
 * Get multiple users by IDs (batch endpoint)
 * No authentication required - used by other services
 */
export const getUsersByIds = async (req: Request, res: Response) => {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new BadRequestError('userIds must be a non-empty array');
    }

    if (userIds.length > 100) {
        throw new BadRequestError('userIds cannot exceed 100 items');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!userIds.every((id: string) => typeof id === 'string' && uuidRegex.test(id))) {
        throw new BadRequestError('All userIds must be valid UUIDs');
    }

    const users = await UserService.getUsersByIds(userIds);

    return res.status(200).json({
        success: true,
        users: users.map(user => ({
            id: user.id,
            username: user.name,
            email: user.email,
            profileImage: user.profileImage,
            status: user.status
        }))
    });
};
