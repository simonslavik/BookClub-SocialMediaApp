import prisma from '../config/database.js';
import { USER_BASIC_FIELDS } from '../constants/index.js';

/**
 * Repository layer for DirectMessage database operations
 */
export class DirectMessageRepository {
  /**
   * Create a direct message
   */
  static async create(senderId: string, receiverId: string, content: string, attachments?: any[], replyToId?: string) {
    return await prisma.directMessage.create({
      data: {
        senderId,
        receiverId,
        content,
        attachments: attachments || [],
        replyToId: replyToId || null,
      },
      include: {
        sender: { select: USER_BASIC_FIELDS },
        receiver: { select: USER_BASIC_FIELDS },
        reactions: true,
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            sender: { select: { id: true, name: true } }
          }
        }
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
        reactions: true,
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            sender: { select: { id: true, name: true } }
          }
        }
      },
    });
  }

  /**
   * Get conversation between two users
   */
  static async getConversation(userId1: string, userId2: string, limit = 50, offset = 0, before?: string) {
    const where: any = {
      OR: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    };
    if (before) {
      where.createdAt = { lt: new Date(before) };
    }
    return await prisma.directMessage.findMany({
      where,
      include: {
        sender: { select: USER_BASIC_FIELDS },
        receiver: { select: USER_BASIC_FIELDS },
        reactions: true,
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            sender: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: before ? 0 : offset,
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

  // ── DM Reactions ──────────────────────────────────────────────

  /**
   * Add or toggle a reaction on a DM
   */
  static async addReaction(messageId: string, userId: string, emoji: string) {
    // Upsert: if same user+message+emoji exists, it's a no-op (unique constraint)
    return await prisma.dMReaction.upsert({
      where: {
        messageId_userId_emoji: { messageId, userId, emoji }
      },
      update: {},
      create: { messageId, userId, emoji },
    });
  }

  /**
   * Remove a reaction from a DM
   */
  static async removeReaction(messageId: string, userId: string, emoji: string) {
    return await prisma.dMReaction.deleteMany({
      where: { messageId, userId, emoji },
    });
  }

  /**
   * Get grouped reactions for a message
   */
  static async getReactions(messageId: string) {
    const reactions = await prisma.dMReaction.findMany({
      where: { messageId },
      select: { emoji: true, userId: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by emoji
    const grouped = new Map<string, string[]>();
    for (const r of reactions) {
      if (!grouped.has(r.emoji)) grouped.set(r.emoji, []);
      grouped.get(r.emoji)!.push(r.userId);
    }

    return Array.from(grouped.entries()).map(([emoji, userIds]) => ({
      emoji,
      count: userIds.length,
      userIds,
    }));
  }
}
