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
  static async findAllByUserId(userId: string, status?: FriendshipStatus) {
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
    });
  }

  /**
   * Get pending friend requests received by user
   */
  static async getPendingRequests(userId: string) {
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
  static async getSentRequests(userId: string) {
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
  static async getAcceptedFriends(userId: string) {
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
   */
  static async getFriendshipStatus(currentUserId: string, targetUserId: string): Promise<string | null> {
    // Check if friends
    const accepted = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: currentUserId, friendId: targetUserId, status: FriendshipStatus.ACCEPTED },
          { userId: targetUserId, friendId: currentUserId, status: FriendshipStatus.ACCEPTED },
        ],
      },
    });
    if (accepted) return 'friends';

    // Check for pending requests
    const pending = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: currentUserId, friendId: targetUserId },
          { userId: targetUserId, friendId: currentUserId },
        ],
      },
    });
    if (!pending) return null;
    return pending.userId === currentUserId ? 'request_sent' : 'request_received';
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
