import { DirectMessageRepository } from '../repositories/directMessage.repository.js';
import { FriendshipRepository } from '../repositories/friendship.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { logger } from '../utils/logger.js';

/**
 * Service layer for direct message operations
 */
export class DirectMessageService {
  /**
   * Send a direct message
   */
  static async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    attachments?: any[]
  ) {
    // Allow DMs without friendship requirement (bookclub members can DM each other)
    // Create message
    const message = await DirectMessageRepository.create(
      senderId,
      receiverId,
      content,
      attachments
    );

    logger.info({
      type: 'MESSAGE_SENT',
      senderId,
      receiverId,
      messageId: message.id,
    });

    return message;
  }

  /**
   * Get conversation between two users
   */
  static async getConversation(
    userId: string,
    partnerId: string,
    limit = 50,
    offset = 0
  ) {
    // Allow DMs without friendship requirement (bookclub members can DM each other)
    const messages = await DirectMessageRepository.getConversation(
      userId,
      partnerId,
      limit,
      offset
    );

    // Get other user info
    const otherUser = await UserRepository.findById(partnerId);

    return {
      messages,
      otherUser: otherUser ? {
        id: otherUser.id,
        name: otherUser.name,
        email: otherUser.email,
        profileImage: otherUser.profileImage
      } : null
    };
  }

  /**
   * Get all conversations for a user
   */
  static async getUserConversations(userId: string) {
    const conversations = await DirectMessageRepository.getUserConversations(userId);
    
    // Fetch user details for each conversation partner
    const conversationsWithUserDetails = await Promise.all(
      conversations.map(async (conv) => {
        const partner = await UserRepository.findById(conv.partnerId);
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
    );
    
    // Filter out conversations where partner user was not found
    return conversationsWithUserDetails.filter(conv => conv.friend !== null);
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
      throw new Error('MESSAGE_NOT_FOUND');
    }

    // Only sender can delete
    if (message.senderId !== userId) {
      throw new Error('UNAUTHORIZED');
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
}
