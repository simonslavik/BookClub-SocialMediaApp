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
   */
  static async getUserConversations(userId: string) {
    // Get unique conversation partners
    const sentMessages = await prisma.directMessage.findMany({
      where: { senderId: userId },
      distinct: ['receiverId'],
      select: { receiverId: true },
    });

    const receivedMessages = await prisma.directMessage.findMany({
      where: { receiverId: userId },
      distinct: ['senderId'],
      select: { senderId: true },
    });

    // Combine and get unique user IDs
    const conversationPartnerIds = Array.from(
      new Set([
        ...sentMessages.map(m => m.receiverId),
        ...receivedMessages.map(m => m.senderId),
      ])
    );

    // Get last message for each conversation
    const conversations = await Promise.all(
      conversationPartnerIds.map(async (partnerId) => {
        const lastMessage = await prisma.directMessage.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: partnerId },
              { senderId: partnerId, receiverId: userId },
            ],
          },
          orderBy: { createdAt: 'desc' },
          include: {
            sender: { select: USER_BASIC_FIELDS },
            receiver: { select: USER_BASIC_FIELDS },
          },
        });

        const unreadCount = await this.getUnreadCount(userId, partnerId);

        return {
          partnerId,
          lastMessage,
          unreadCount,
        };
      })
    );

    return conversations.filter(c => c.lastMessage).sort((a, b) => 
      b.lastMessage!.createdAt.getTime() - a.lastMessage!.createdAt.getTime()
    );
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
