import { DirectMessageRepository } from '../repositories/directMessage.repository.js';
import { FriendshipRepository } from '../repositories/friendship.repository.js';
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
    // Check if users are friends
    const areFriends = await FriendshipRepository.areFriends(senderId, receiverId);
    if (!areFriends) {
      throw new Error('NOT_FRIENDS');
    }

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
    // Check if users are friends
    const areFriends = await FriendshipRepository.areFriends(userId, partnerId);
    if (!areFriends) {
      throw new Error('NOT_FRIENDS');
    }

    const messages = await DirectMessageRepository.getConversation(
      userId,
      partnerId,
      limit,
      offset
    );

    return messages;
  }

  /**
   * Get all conversations for a user
   */
  static async getUserConversations(userId: string) {
    return await DirectMessageRepository.getUserConversations(userId);
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
