import { jest } from '@jest/globals';
// Mock dependencies
jest.mock('../../../src/utils/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  logError: jest.fn(),
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockDMRepo = {
  create: jest.fn(),
  findById: jest.fn(),
  getConversation: jest.fn(),
  getUserConversations: jest.fn(),
  markAsRead: jest.fn(),
  markConversationAsRead: jest.fn(),
  getUnreadCount: jest.fn(),
  getTotalUnreadCount: jest.fn(),
  delete: jest.fn(),
  deleteConversation: jest.fn(),
};

const mockUserRepo = {
  findById: jest.fn(),
};

const mockFriendshipRepo = {
  areFriends: jest.fn(),
};

jest.mock('../../../src/repositories/directMessage.repository.js', () => ({
  DirectMessageRepository: mockDMRepo,
}));

jest.mock('../../../src/repositories/user.repository.js', () => ({
  UserRepository: mockUserRepo,
}));

jest.mock('../../../src/repositories/friendship.repository.js', () => ({
  FriendshipRepository: mockFriendshipRepo,
}));

import { DirectMessageService } from '../../../src/services/directMessage.service.js';

describe('DirectMessageService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('sendMessage', () => {
    it('should create and return message', async () => {
      const mockMsg = {
        id: 'msg-1',
        senderId: 'u-1',
        receiverId: 'u-2',
        content: 'Hello',
      };
      mockDMRepo.create.mockResolvedValue(mockMsg);

      const result = await DirectMessageService.sendMessage('u-1', 'u-2', 'Hello');

      expect(mockDMRepo.create).toHaveBeenCalledWith('u-1', 'u-2', 'Hello', undefined);
      expect(result).toEqual(mockMsg);
    });

    it('should pass attachments', async () => {
      const attachments = [{ url: 'file.png' }];
      mockDMRepo.create.mockResolvedValue({ id: 'msg-1' });

      await DirectMessageService.sendMessage('u-1', 'u-2', 'Hi', attachments);

      expect(mockDMRepo.create).toHaveBeenCalledWith('u-1', 'u-2', 'Hi', attachments);
    });
  });

  describe('getConversation', () => {
    it('should return conversation with other user info', async () => {
      mockDMRepo.getConversation.mockResolvedValue([{ id: 'msg-1' }]);
      mockUserRepo.findById.mockResolvedValue({
        id: 'u-2',
        name: 'Partner',
        email: 'partner@test.com',
        profileImage: null,
      });

      const result = await DirectMessageService.getConversation('u-1', 'u-2');

      expect(result.messages).toHaveLength(1);
      expect(result.otherUser).toBeDefined();
      expect(result.otherUser!.name).toBe('Partner');
    });
  });

  describe('markMessageAsRead', () => {
    it('should throw when message not found', async () => {
      mockDMRepo.findById.mockResolvedValue(null);

      await expect(DirectMessageService.markMessageAsRead('u-1', 'msg-1'))
        .rejects.toThrow('MESSAGE_NOT_FOUND');
    });

    it('should throw when user is not the receiver', async () => {
      mockDMRepo.findById.mockResolvedValue({
        id: 'msg-1',
        receiverId: 'u-2', // not u-1
      });

      await expect(DirectMessageService.markMessageAsRead('u-1', 'msg-1'))
        .rejects.toThrow('UNAUTHORIZED');
    });

    it('should mark message as read', async () => {
      mockDMRepo.findById.mockResolvedValue({
        id: 'msg-1',
        receiverId: 'u-1',
      });
      mockDMRepo.markAsRead.mockResolvedValue({ id: 'msg-1', isRead: true });

      const result = await DirectMessageService.markMessageAsRead('u-1', 'msg-1');

      expect(mockDMRepo.markAsRead).toHaveBeenCalledWith('msg-1');
    });
  });

  describe('deleteMessage', () => {
    it('should throw NotFoundError when message not found', async () => {
      mockDMRepo.findById.mockResolvedValue(null);

      await expect(DirectMessageService.deleteMessage('u-1', 'msg-1'))
        .rejects.toThrow('Message not found');
    });

    it('should throw ForbiddenError when user is not the sender', async () => {
      mockDMRepo.findById.mockResolvedValue({
        id: 'msg-1',
        senderId: 'u-2', // not u-1
      });

      await expect(DirectMessageService.deleteMessage('u-1', 'msg-1'))
        .rejects.toThrow('You can only delete your own messages');
    });

    it('should delete message when user is the sender', async () => {
      mockDMRepo.findById.mockResolvedValue({
        id: 'msg-1',
        senderId: 'u-1',
      });
      mockDMRepo.delete.mockResolvedValue(undefined);

      const result = await DirectMessageService.deleteMessage('u-1', 'msg-1');

      expect(mockDMRepo.delete).toHaveBeenCalledWith('msg-1');
      expect(result.message).toContain('deleted');
    });
  });

  describe('deleteConversation', () => {
    it('should delete entire conversation', async () => {
      mockDMRepo.deleteConversation.mockResolvedValue(undefined);

      const result = await DirectMessageService.deleteConversation('u-1', 'u-2');

      expect(mockDMRepo.deleteConversation).toHaveBeenCalledWith('u-1', 'u-2');
      expect(result.message).toContain('deleted');
    });
  });

  describe('markConversationAsRead', () => {
    it('should delegate to repository', async () => {
      mockDMRepo.markConversationAsRead.mockResolvedValue({ count: 5 });

      await DirectMessageService.markConversationAsRead('u-1', 'u-2');

      expect(mockDMRepo.markConversationAsRead).toHaveBeenCalledWith('u-1', 'u-2');
    });
  });

  describe('getTotalUnreadCount', () => {
    it('should delegate to repository', async () => {
      mockDMRepo.getTotalUnreadCount.mockResolvedValue(3);

      const result = await DirectMessageService.getTotalUnreadCount('u-1');

      expect(result).toBe(3);
    });
  });
});
