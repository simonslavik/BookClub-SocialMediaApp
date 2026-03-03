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
  static async findByUserIds(userId: string, friendId: string) {
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
  static async findById(friendshipId: string) {
    return await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });
  }

  /**
   * Create friendship request
   */
  static async create(userId: string, friendId: string) {
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
  static async updateStatus(friendshipId: string, status: FriendshipStatus) {
    return await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status },
    });
  }

  /**
   * Delete friendship
   */
  static async delete(friendshipId: string) {
    return await prisma.friendship.delete({
      where: { id: friendshipId },
    });
  }

  /**
   * Get all user friendships with status
   */
  static async findAllByUserId(userId: string, status?: FriendshipStatus, limit = 200) {
    const where: any = {
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
      take: limit,
    });
  }

  /**
   * Get pending friend requests received by user
   */
  static async getPendingRequests(userId: string, limit = 100) {
    return await prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        user: { select: USER_BASIC_FIELDS },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get pending friend requests sent by user
   */
  static async getSentRequests(userId: string, limit = 100) {
    return await prisma.friendship.findMany({
      where: {
        userId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        friend: { select: USER_BASIC_FIELDS },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get accepted friends
   */
  static async getAcceptedFriends(userId: string, limit = 200) {
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
      take: limit,
    });
  }

  /**
   * Check if users are friends
   */
  static async areFriends(userId: string, friendId: string): Promise<boolean> {
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

  /**
   * Get friendship status between two users
   * Optimized: single query instead of two sequential queries
   */
  static async getFriendshipStatus(currentUserId: string, targetUserId: string): Promise<string | null> {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: currentUserId, friendId: targetUserId },
          { userId: targetUserId, friendId: currentUserId },
        ],
      },
    });

    if (!friendship) return null;
    if (friendship.status === FriendshipStatus.ACCEPTED) return 'friends';
    if (friendship.status === FriendshipStatus.BLOCKED) return 'blocked';
    // PENDING
    return friendship.userId === currentUserId ? 'request_sent' : 'request_received';
  }

  /**
   * Count accepted friends for a user
   */
  static async countFriends(userId: string): Promise<number> {
    return await prisma.friendship.count({
      where: {
        OR: [
          { userId },
          { friendId: userId },
        ],
        status: FriendshipStatus.ACCEPTED,
      },
    });
  }
}
