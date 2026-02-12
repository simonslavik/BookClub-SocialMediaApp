import { jest } from '@jest/globals';
import { Request, Response } from 'express';

// Mock dependencies before imports
jest.mock('../../../src/utils/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  logError: jest.fn(),
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockDirectMessageService = {
  getConversation: jest.fn(),
  sendMessage: jest.fn(),
  getUserConversations: jest.fn(),
  deleteMessage: jest.fn(),
  markConversationAsRead: jest.fn(),
};

jest.mock('../../../src/services/directMessage.service.js', () => ({
  DirectMessageService: mockDirectMessageService,
}));

jest.mock('../../../src/utils/errors.js', () => {
  class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(msg: string) { super(msg); this.name = 'UnauthorizedError'; }
  }
  class BadRequestError extends Error {
    statusCode = 400;
    constructor(msg: string) { super(msg); this.name = 'BadRequestError'; }
  }
  class ForbiddenError extends Error {
    statusCode = 403;
    constructor(msg: string) { super(msg); this.name = 'ForbiddenError'; }
  }
  return { UnauthorizedError, BadRequestError, ForbiddenError };
});

import {
  getDirectMessages,
  sendDirectMessage,
  getConversations,
  deleteDirectMessage,
  markConversationAsRead,
} from '../../../src/controllers/directMessagesController.js';

describe('DirectMessagesController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = { body: {}, params: {}, query: {}, user: undefined, headers: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => jest.clearAllMocks());

  // ─── getDirectMessages ──────────────────────────────
  describe('getDirectMessages', () => {
    it('should return conversation with pagination', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.params = { otherUserId: 'u-2' };
      mockReq.query = { page: '1', limit: '50' };
      mockDirectMessageService.getConversation.mockResolvedValue({
        messages: [{ id: 'm-1', content: 'Hello' }],
        otherUser: { id: 'u-2', name: 'Jane' },
      });

      await getDirectMessages(mockReq as Request, mockRes as Response);

      expect(mockDirectMessageService.getConversation).toHaveBeenCalledWith('u-1', 'u-2', 50, 0);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            messages: [{ id: 'm-1', content: 'Hello' }],
            otherUser: { id: 'u-2', name: 'Jane' },
          }),
        })
      );
    });

    it('should throw UnauthorizedError when not authenticated', async () => {
      mockReq.params = { otherUserId: 'u-2' };

      await expect(getDirectMessages(mockReq as Request, mockRes as Response))
        .rejects.toThrow('User not authenticated');
    });

    it('should throw BadRequestError when otherUserId is missing', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.params = {};

      await expect(getDirectMessages(mockReq as Request, mockRes as Response))
        .rejects.toThrow('Other user ID is required');
    });

    it('should calculate offset correctly for page 2', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.params = { otherUserId: 'u-2' };
      mockReq.query = { page: '2', limit: '10' };
      mockDirectMessageService.getConversation.mockResolvedValue({
        messages: [],
        otherUser: null,
      });

      await getDirectMessages(mockReq as Request, mockRes as Response);

      expect(mockDirectMessageService.getConversation).toHaveBeenCalledWith('u-1', 'u-2', 10, 10);
    });
  });

  // ─── sendDirectMessage ──────────────────────────────
  describe('sendDirectMessage', () => {
    it('should send message and return 200', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.body = { receiverId: 'u-2', content: 'Hello!', attachments: [] };
      mockDirectMessageService.sendMessage.mockResolvedValue({
        id: 'm-1',
        content: 'Hello!',
        senderId: 'u-1',
        receiverId: 'u-2',
      });

      await sendDirectMessage(mockReq as Request, mockRes as Response);

      expect(mockDirectMessageService.sendMessage).toHaveBeenCalledWith('u-1', 'u-2', 'Hello!', []);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should use X-User-Id header when no user on req', async () => {
      mockReq.headers = { 'x-user-id': 'u-1' };
      mockReq.body = { receiverId: 'u-2', content: 'Hi' };
      mockDirectMessageService.sendMessage.mockResolvedValue({ id: 'm-1' });

      await sendDirectMessage(mockReq as Request, mockRes as Response);

      expect(mockDirectMessageService.sendMessage).toHaveBeenCalledWith('u-1', 'u-2', 'Hi', []);
    });

    it('should throw UnauthorizedError when not authenticated', async () => {
      mockReq.headers = {};
      mockReq.body = { receiverId: 'u-2', content: 'Hi' };

      await expect(sendDirectMessage(mockReq as Request, mockRes as Response))
        .rejects.toThrow('User not authenticated');
    });

    it('should trim content', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.body = { receiverId: 'u-2', content: '  Hello!  ' };
      mockDirectMessageService.sendMessage.mockResolvedValue({ id: 'm-1' });

      await sendDirectMessage(mockReq as Request, mockRes as Response);

      expect(mockDirectMessageService.sendMessage).toHaveBeenCalledWith('u-1', 'u-2', 'Hello!', []);
    });

    it('should handle null content gracefully', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.body = { receiverId: 'u-2', content: null, attachments: [{ url: 'file.png' }] };
      mockDirectMessageService.sendMessage.mockResolvedValue({ id: 'm-1' });

      await sendDirectMessage(mockReq as Request, mockRes as Response);

      expect(mockDirectMessageService.sendMessage).toHaveBeenCalledWith('u-1', 'u-2', '', [{ url: 'file.png' }]);
    });
  });

  // ─── getConversations ──────────────────────────────
  describe('getConversations', () => {
    it('should return user conversations', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockDirectMessageService.getUserConversations.mockResolvedValue([
        { otherUserId: 'u-2', lastMessage: 'Hi' },
      ]);

      await getConversations(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: [{ otherUserId: 'u-2', lastMessage: 'Hi' }],
        })
      );
    });

    it('should throw UnauthorizedError when not authenticated', async () => {
      await expect(getConversations(mockReq as Request, mockRes as Response))
        .rejects.toThrow('User not authenticated');
    });
  });

  // ─── deleteDirectMessage ──────────────────────────────
  describe('deleteDirectMessage', () => {
    it('should delete message and return 200', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.params = { messageId: 'm-1' };
      mockDirectMessageService.deleteMessage.mockResolvedValue(undefined);

      await deleteDirectMessage(mockReq as Request, mockRes as Response);

      expect(mockDirectMessageService.deleteMessage).toHaveBeenCalledWith('u-1', 'm-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should throw UnauthorizedError when not authenticated', async () => {
      mockReq.params = { messageId: 'm-1' };

      await expect(deleteDirectMessage(mockReq as Request, mockRes as Response))
        .rejects.toThrow('User not authenticated');
    });

    it('should throw BadRequestError when messageId missing', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.params = {};

      await expect(deleteDirectMessage(mockReq as Request, mockRes as Response))
        .rejects.toThrow('Message ID is required');
    });
  });

  // ─── markConversationAsRead ──────────────────────────────
  describe('markConversationAsRead', () => {
    it('should mark conversation as read and return 200', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.params = { otherUserId: 'u-2' };
      mockDirectMessageService.markConversationAsRead.mockResolvedValue(undefined);

      await markConversationAsRead(mockReq as Request, mockRes as Response);

      expect(mockDirectMessageService.markConversationAsRead).toHaveBeenCalledWith('u-1', 'u-2');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should throw UnauthorizedError when not authenticated', async () => {
      mockReq.params = { otherUserId: 'u-2' };

      await expect(markConversationAsRead(mockReq as Request, mockRes as Response))
        .rejects.toThrow('User not authenticated');
    });

    it('should throw BadRequestError when otherUserId missing', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.params = {};

      await expect(markConversationAsRead(mockReq as Request, mockRes as Response))
        .rejects.toThrow('Other user ID is required');
    });
  });
});
