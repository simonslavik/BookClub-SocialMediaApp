import prisma from '../config/database.js';
import { FriendshipStatus } from '@prisma/client';
import { USER_BASIC_FIELDS } from '../constants/index.js';
/**
 * Repository layer for Friendship database operations
 */
export class FriendshipRepository {
    /**
     * Find friendship by user IDs
     */
    static async findByUserIds(userId, friendId) {
        return await prisma.friendship.findUnique({
            where: {
                userId_friendId: {
                    userId,
                    friendId,
                },
            },
        });
    }
    /**
     * Find friendship by ID
     */
    static async findById(friendshipId) {
        return await prisma.friendship.findUnique({
            where: { id: friendshipId },
        });
    }
    /**
     * Create friendship request
     */
    static async create(userId, friendId) {
        return await prisma.friendship.create({
            data: {
                userId,
                friendId,
                status: FriendshipStatus.PENDING,
            },
        });
    }
    /**
     * Update friendship status
     */
    static async updateStatus(friendshipId, status) {
        return await prisma.friendship.update({
            where: { id: friendshipId },
            data: { status },
        });
    }
    /**
     * Delete friendship
     */
    static async delete(friendshipId) {
        return await prisma.friendship.delete({
            where: { id: friendshipId },
        });
    }
    /**
     * Get all user friendships with status
     */
    static async findAllByUserId(userId, status) {
        const where = {
            OR: [
                { userId },
                { friendId: userId },
            ],
        };
        if (status) {
            where.status = status;
        }
        return await prisma.friendship.findMany({
            where,
            include: {
                user: { select: USER_BASIC_FIELDS },
                friend: { select: USER_BASIC_FIELDS },
            },
        });
    }
    /**
     * Get pending friend requests received by user
     */
    static async getPendingRequests(userId) {
        return await prisma.friendship.findMany({
            where: {
                friendId: userId,
                status: FriendshipStatus.PENDING,
            },
            include: {
                user: { select: USER_BASIC_FIELDS },
            },
        });
    }
    /**
     * Get pending friend requests sent by user
     */
    static async getSentRequests(userId) {
        return await prisma.friendship.findMany({
            where: {
                userId,
                status: FriendshipStatus.PENDING,
            },
            include: {
                friend: { select: USER_BASIC_FIELDS },
            },
        });
    }
    /**
     * Get accepted friends
     */
    static async getAcceptedFriends(userId) {
        return await prisma.friendship.findMany({
            where: {
                OR: [
                    { userId, status: FriendshipStatus.ACCEPTED },
                    { friendId: userId, status: FriendshipStatus.ACCEPTED },
                ],
            },
            include: {
                user: { select: USER_BASIC_FIELDS },
                friend: { select: USER_BASIC_FIELDS },
            },
        });
    }
    /**
     * Check if users are friends
     */
    static async areFriends(userId, friendId) {
        const friendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId, friendId, status: FriendshipStatus.ACCEPTED },
                    { userId: friendId, friendId: userId, status: FriendshipStatus.ACCEPTED },
                ],
            },
        });
        return !!friendship;
    }
}
//# sourceMappingURL=friendship.repository.js.map