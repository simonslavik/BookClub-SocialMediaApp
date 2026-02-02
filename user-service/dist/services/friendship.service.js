import { FriendshipRepository } from '../repositories/friendship.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { FriendshipStatus } from '@prisma/client';
import { logger } from '../utils/logger.js';
/**
 * Service layer for friendship operations
 */
export class FriendshipService {
    /**
     * Send friend request
     */
    static async sendFriendRequest(userId, friendId) {
        // Check if users are the same
        if (userId === friendId) {
            throw new Error('CANNOT_ADD_SELF');
        }
        // Check if friend exists
        const friendUser = await UserRepository.findById(friendId);
        if (!friendUser) {
            throw new Error('USER_NOT_FOUND');
        }
        // Check if friendship already exists
        const existingFriendship = await FriendshipRepository.findByUserIds(userId, friendId);
        if (existingFriendship) {
            throw new Error('FRIENDSHIP_EXISTS');
        }
        // Check reverse (if friend already sent request)
        const reverseFriendship = await FriendshipRepository.findByUserIds(friendId, userId);
        if (reverseFriendship) {
            // Auto-accept if they already sent a request
            if (reverseFriendship.status === FriendshipStatus.PENDING) {
                await FriendshipRepository.updateStatus(reverseFriendship.id, FriendshipStatus.ACCEPTED);
                logger.info({
                    type: 'FRIEND_REQUEST_AUTO_ACCEPTED',
                    userId,
                    friendId,
                });
                return { message: 'Friend request accepted automatically', friendship: reverseFriendship };
            }
            throw new Error('FRIENDSHIP_EXISTS');
        }
        // Create friend request
        const friendship = await FriendshipRepository.create(userId, friendId);
        logger.info({
            type: 'FRIEND_REQUEST_SENT',
            userId,
            friendId,
        });
        return friendship;
    }
    /**
     * Accept friend request
     */
    static async acceptFriendRequest(userId, friendshipId) {
        const friendship = await FriendshipRepository.findById(friendshipId);
        if (!friendship) {
            throw new Error('FRIENDSHIP_NOT_FOUND');
        }
        // Only the receiver can accept
        if (friendship.friendId !== userId) {
            throw new Error('UNAUTHORIZED');
        }
        if (friendship.status !== FriendshipStatus.PENDING) {
            throw new Error('INVALID_STATUS');
        }
        const updatedFriendship = await FriendshipRepository.updateStatus(friendshipId, FriendshipStatus.ACCEPTED);
        logger.info({
            type: 'FRIEND_REQUEST_ACCEPTED',
            userId,
            friendId: friendship.userId,
        });
        return updatedFriendship;
    }
    /**
     * Reject friend request
     */
    static async rejectFriendRequest(userId, friendshipId) {
        const friendship = await FriendshipRepository.findById(friendshipId);
        if (!friendship) {
            throw new Error('FRIENDSHIP_NOT_FOUND');
        }
        // Only the receiver can reject
        if (friendship.friendId !== userId) {
            throw new Error('UNAUTHORIZED');
        }
        await FriendshipRepository.delete(friendshipId);
        logger.info({
            type: 'FRIEND_REQUEST_REJECTED',
            userId,
            friendId: friendship.userId,
        });
        return { message: 'Friend request rejected' };
    }
    /**
     * Remove friend (by friendId, not friendshipId)
     */
    static async removeFriend(userId, friendId) {
        const friendship = await FriendshipRepository.findByUserIds(userId, friendId);
        if (!friendship) {
            throw new Error('FRIENDSHIP_NOT_FOUND');
        }
        if (friendship.status !== FriendshipStatus.ACCEPTED) {
            throw new Error('NOT_FRIENDS');
        }
        await FriendshipRepository.delete(friendship.id);
        logger.info({
            type: 'FRIEND_REMOVED',
            userId,
            friendId,
        });
        return { message: 'Friend removed' };
    }
    /**
     * Block user
     */
    static async blockUser(userId, friendshipId) {
        const friendship = await FriendshipRepository.findById(friendshipId);
        if (!friendship) {
            throw new Error('FRIENDSHIP_NOT_FOUND');
        }
        // Only friendship participants can block
        if (friendship.userId !== userId && friendship.friendId !== userId) {
            throw new Error('UNAUTHORIZED');
        }
        const updatedFriendship = await FriendshipRepository.updateStatus(friendshipId, FriendshipStatus.BLOCKED);
        logger.info({
            type: 'USER_BLOCKED',
            userId,
            friendshipId,
        });
        return updatedFriendship;
    }
    /**
     * Get all friends with pagination
     */
    static async getFriends(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const friendships = await FriendshipRepository.getAcceptedFriends(userId);
        const totalCount = friendships.length;
        const paginatedFriendships = friendships.slice(skip, skip + limit);
        // Map to return the friend (not the requester)
        const friends = paginatedFriendships.map(f => ({
            friendshipId: f.id,
            friend: f.userId === userId ? f.friend : f.user,
            since: f.createdAt,
        }));
        return { friends, totalCount };
    }
    /**
     * Get pending friend requests received with pagination
     */
    static async getPendingRequests(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const allRequests = await FriendshipRepository.getPendingRequests(userId);
        const totalCount = allRequests.length;
        const paginatedRequests = allRequests.slice(skip, skip + limit);
        const requests = paginatedRequests.map(r => ({
            friendshipId: r.id,
            from: r.user,
            createdAt: r.createdAt,
        }));
        return { requests, totalCount };
    }
    /**
     * Get pending friend requests sent
     */
    static async getSentRequests(userId) {
        const requests = await FriendshipRepository.getSentRequests(userId);
        return requests.map(r => ({
            friendshipId: r.id,
            to: r.friend,
            createdAt: r.createdAt,
        }));
    }
    /**
     * Check if users are friends
     */
    static async areFriends(userId, friendId) {
        return await FriendshipRepository.areFriends(userId, friendId);
    }
}
//# sourceMappingURL=friendship.service.js.map