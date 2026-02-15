import prisma from '../config/database.js';
import { USER_BASIC_FIELDS } from '../constants/index.js';

/**
 * Repository layer for DirectMessage database operations
 */
export class DirectMessageRepository {
  /**
   * Create a direct message
   */
  static async create(senderId: string, receiverId: string, content: string, attachments?: any[]) {
    return await prisma.directMessage.create({
      data: {
        senderId,
        receiverId,
        content,
        attachments: attachments || [],
      },
      include: {
        sender: { select: USER_BASIC_FIELDS },
        receiver: { select: USER_BASIC_FIELDS },
      },
    });
  }

  /**
   * Find message by ID
   */
  static async findById(messageId: string) {
    return await prisma.directMessage.findUnique({
      where: { id: messageId },
      include: {
        sender: { select: USER_BASIC_FIELDS },
        receiver: { select: USER_BASIC_FIELDS },
      },
    });
  }

  /**
   * Get conversation between two users
   */
  static async getConversation(userId1: string, userId2: string, limit = 50, offset = 0) {
    return await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      include: {
        sender: { select: USER_BASIC_FIELDS },
        receiver: { select: USER_BASIC_FIELDS },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get all conversations for a user
   * Optimized: uses parallel queries + batch operations instead of per-partner loops
   */
  static async getUserConversations(userId: string) {
    // Get unique conversation partners in parallel (was sequential)
    const [sentMessages, receivedMessages] = await Promise.all([
      prisma.directMessage.findMany({
        where: { senderId: userId },
        distinct: ['receiverId'],
        select: { receiverId: true },
      }),
      prisma.directMessage.findMany({
        where: { receiverId: userId },
        distinct: ['senderId'],
        select: { senderId: true },
      }),
    ]);

    // Combine and get unique user IDs
    const conversationPartnerIds = Array.from(
      new Set([
        ...sentMessages.map(m => m.receiverId),
        ...receivedMessages.map(m => m.senderId),
      ])
    );

    if (conversationPartnerIds.length === 0) return [];

    // Batch: get last message for ALL partners in one query per partner pair direction,
    // then deduplicate. We fetch the most recent message per conversation in bulk.
    const allRecentMessages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: { in: conversationPartnerIds } },
          { senderId: { in: conversationPartnerIds }, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        sender: { select: USER_BASIC_FIELDS },
        receiver: { select: USER_BASIC_FIELDS },
      },
    });

    // Group by partner and pick the most recent message per conversation
    const lastMessageByPartner = new Map<string, typeof allRecentMessages[0]>();
    for (const msg of allRecentMessages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!lastMessageByPartner.has(partnerId)) {
        lastMessageByPartner.set(partnerId, msg); // Already sorted desc, first is most recent
      }
    }

    // Batch: get unread counts grouped by sender in one query
    const unreadCounts = await prisma.directMessage.groupBy({
      by: ['senderId'],
      where: {
        receiverId: userId,
        senderId: { in: conversationPartnerIds },
        isRead: false,
      },
      _count: { id: true },
    });

    const unreadMap = new Map(unreadCounts.map(u => [u.senderId, u._count.id]));

    // Build conversations from batched results
    const conversations = conversationPartnerIds
      .map(partnerId => ({
        partnerId,
        lastMessage: lastMessageByPartner.get(partnerId) || null,
        unreadCount: unreadMap.get(partnerId) || 0,
      }))
      .filter(c => c.lastMessage)
      .sort((a, b) => b.lastMessage!.createdAt.getTime() - a.lastMessage!.createdAt.getTime());

    return conversations;
  }

  /**
   * Mark message as read
   */
  static async markAsRead(messageId: string) {
    return await prisma.directMessage.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all messages in conversation as read
   */
  static async markConversationAsRead(userId: string, partnerId: string) {
    return await prisma.directMessage.updateMany({
      where: {
        senderId: partnerId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  /**
   * Get unread message count from a specific user
   */
  static async getUnreadCount(receiverId: string, senderId: string) {
    return await prisma.directMessage.count({
      where: {
        senderId,
        receiverId,
        isRead: false,
      },
    });
  }

  /**
   * Get total unread count for user
   */
  static async getTotalUnreadCount(userId: string) {
    return await prisma.directMessage.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });
  }

  /**
   * Delete message
   */
  static async delete(messageId: string) {
    return await prisma.directMessage.delete({
      where: { id: messageId },
    });
  }

  /**
   * Delete conversation
   */
  static async deleteConversation(userId: string, partnerId: string) {
    return await prisma.directMessage.deleteMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
    });
  }
}
