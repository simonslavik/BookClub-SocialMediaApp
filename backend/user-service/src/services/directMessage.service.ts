import { DirectMessageRepository } from '../repositories/directMessage.repository.js';
import { FriendshipRepository } from '../repositories/friendship.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

/**
 * Service layer for direct message operations
 */
export class DirectMessageService {
  /**
   * Group raw Prisma DMReaction records into { emoji, count, userIds } format
   */
  private static groupReactions(rawReactions: any[]): { emoji: string; count: number; userIds: string[] }[] {
    if (!rawReactions || rawReactions.length === 0) return [];
    const grouped = new Map<string, string[]>();
    for (const r of rawReactions) {
      if (!grouped.has(r.emoji)) grouped.set(r.emoji, []);
      grouped.get(r.emoji)!.push(r.userId);
    }
    return Array.from(grouped.entries()).map(([emoji, userIds]) => ({
      emoji,
      count: userIds.length,
      userIds,
    }));
  }

  /**
   * Normalize a message's reactions from raw Prisma records to grouped format
   */
  private static normalizeMessage(message: any): any {
    if (!message) return message;
    return {
      ...message,
      reactions: this.groupReactions(message.reactions || []),
    };
  }

  /**
   * Send a direct message
   */
  static async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    attachments?: any[],
    replyToId?: string
  ) {
    // Allow DMs without friendship requirement (bookclub members can DM each other)
    // Create message
    const message = await DirectMessageRepository.create(
      senderId,
      receiverId,
      content,
      attachments,
      replyToId
    );

    logger.info({
      type: 'MESSAGE_SENT',
      senderId,
      receiverId,
      messageId: message.id,
    });

    return this.normalizeMessage(message);
  }

  /**
   * Get conversation between two users
   * Optimized: extracts partner info from already-fetched messages (include: sender/receiver)
   */
  static async getConversation(
    userId: string,
    partnerId: string,
    limit = 50,
    offset = 0,
    before?: string
  ) {
    // Allow DMs without friendship requirement (bookclub members can DM each other)
    const messages = await DirectMessageRepository.getConversation(
      userId,
      partnerId,
      limit,
      offset,
      before
    );

    // Normalize reactions in all messages
    const normalizedMessages = messages.map((m: any) => this.normalizeMessage(m));

    // Extract partner info from already-fetched messages (they include sender/receiver)
    // Only fall back to a separate query if no messages exist
    let otherUser: { id: string; name: string; email: string; profileImage: string | null } | null = null;

    if (normalizedMessages.length > 0) {
      const firstMessage = normalizedMessages[0] as any;
      const partner = firstMessage.senderId === partnerId
        ? firstMessage.sender
        : firstMessage.receiver;
      if (partner) {
        otherUser = {
          id: partner.id,
          name: partner.name,
          email: partner.email,
          profileImage: partner.profileImage
        };
      }
    }

    // Fallback for empty conversations
    if (!otherUser) {
      const partner = await UserRepository.findById(partnerId);
      if (partner) {
        otherUser = {
          id: partner.id,
          name: partner.name,
          email: partner.email,
          profileImage: partner.profileImage
        };
      }
    }

    return { messages: normalizedMessages, otherUser };
  }

  /**
   * Get all conversations for a user
   * Optimized: batch-fetches all partner details in a single query
   */
  static async getUserConversations(userId: string) {
    const conversations = await DirectMessageRepository.getUserConversations(userId);

    if (conversations.length === 0) return [];

    // Batch fetch all partner details in one query instead of N individual queries
    const partnerIds = conversations.map(c => c.partnerId);
    const partners = await UserRepository.findManyByIds(partnerIds);
    const partnerMap = new Map(partners.map((p: any) => [p.id, p]));

    return conversations
      .map(conv => {
        const partner = partnerMap.get(conv.partnerId);
        return {
          friend: partner ? {
            id: partner.id,
            name: partner.name,
            email: partner.email,
            profileImage: partner.profileImage
          } : null,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount
        };
      })
      .filter(conv => conv.friend !== null);
  }

  /**
   * Mark message as read
   */
  static async markMessageAsRead(userId: string, messageId: string) {
    const message = await DirectMessageRepository.findById(messageId);

    if (!message) {
      throw new Error('MESSAGE_NOT_FOUND');
    }

    // Only receiver can mark as read
    if (message.receiverId !== userId) {
      throw new Error('UNAUTHORIZED');
    }

    return await DirectMessageRepository.markAsRead(messageId);
  }

  /**
   * Mark all messages in conversation as read
   */
  static async markConversationAsRead(userId: string, partnerId: string) {
    return await DirectMessageRepository.markConversationAsRead(userId, partnerId);
  }

  /**
   * Get unread count from a specific user
   */
  static async getUnreadCount(userId: string, partnerId: string) {
    return await DirectMessageRepository.getUnreadCount(userId, partnerId);
  }

  /**
   * Get total unread count
   */
  static async getTotalUnreadCount(userId: string) {
    return await DirectMessageRepository.getTotalUnreadCount(userId);
  }

  /**
   * Delete a message
   */
  static async deleteMessage(userId: string, messageId: string) {
    const message = await DirectMessageRepository.findById(messageId);

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Only sender can delete
    if (message.senderId !== userId) {
      throw new ForbiddenError('You can only delete your own messages');
    }

    await DirectMessageRepository.delete(messageId);

    logger.info({
      type: 'MESSAGE_DELETED',
      userId,
      messageId,
    });

    return { message: 'Message deleted' };
  }

  /**
   * Delete entire conversation
   */
  static async deleteConversation(userId: string, partnerId: string) {
    await DirectMessageRepository.deleteConversation(userId, partnerId);

    logger.info({
      type: 'CONVERSATION_DELETED',
      userId,
      partnerId,
    });

    return { message: 'Conversation deleted' };
  }

  // ── DM Reactions ──────────────────────────────────────────

  static async addReaction(userId: string, messageId: string, emoji: string) {
    const message = await DirectMessageRepository.findById(messageId);
    if (!message) throw new NotFoundError('Message not found');

    // Only sender or receiver can react
    if (message.senderId !== userId && message.receiverId !== userId) {
      throw new ForbiddenError('You are not part of this conversation');
    }

    await DirectMessageRepository.addReaction(messageId, userId, emoji);
    const reactions = await DirectMessageRepository.getReactions(messageId);
    return { messageId, reactions };
  }

  static async removeReaction(userId: string, messageId: string, emoji: string) {
    const message = await DirectMessageRepository.findById(messageId);
    if (!message) throw new NotFoundError('Message not found');

    if (message.senderId !== userId && message.receiverId !== userId) {
      throw new ForbiddenError('You are not part of this conversation');
    }

    await DirectMessageRepository.removeReaction(messageId, userId, emoji);
    const reactions = await DirectMessageRepository.getReactions(messageId);
    return { messageId, reactions };
  }

  static async getReactions(messageId: string) {
    return await DirectMessageRepository.getReactions(messageId);
  }
}
