import { jest } from '@jest/globals';
import { Request, Response } from 'express';

// Mock dependencies before imports
jest.mock('../../../src/utils/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  logError: jest.fn(),
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockFriendshipService = {
  sendFriendRequest: jest.fn(),
  acceptFriendRequest: jest.fn(),
  rejectFriendRequest: jest.fn(),
  removeFriend: jest.fn(),
  getFriends: jest.fn(),
  getPendingRequests: jest.fn(),
};

jest.mock('../../../src/services/friendship.service.js', () => ({
  FriendshipService: mockFriendshipService,
}));

import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  listFriends,
  listFriendRequests,
} from '../../../src/controllers/friendsController.js';

describe('FriendsController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = { body: {}, params: {}, query: {}, user: undefined };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => jest.clearAllMocks());

  // ─── sendFriendRequest ──────────────────────────────
  describe('sendFriendRequest', () => {
    it('should send friend request and return 200', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.body = { recipientId: 'u-2' };
      mockFriendshipService.sendFriendRequest.mockResolvedValue({ id: 'f-1', status: 'PENDING' });

      await sendFriendRequest(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should handle auto-accepted friend request', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.body = { recipientId: 'u-2' };
      mockFriendshipService.sendFriendRequest.mockResolvedValue({
        message: 'Friend request auto-accepted',
        friendship: { id: 'f-1', status: 'ACCEPTED' },
      });

      await sendFriendRequest(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Friend request auto-accepted' })
      );
    });

    it('should return 401 when not authenticated', async () => {
      mockReq.body = { recipientId: 'u-2' };

      await sendFriendRequest(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 when sending to yourself', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.body = { recipientId: 'u-1' };
      mockFriendshipService.sendFriendRequest.mockRejectedValue(new Error('CANNOT_ADD_YOURSELF'));

      await sendFriendRequest(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Cannot send friend request to yourself' })
      );
    });

    it('should return 404 when user not found', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.body = { recipientId: 'u-99' };
      mockFriendshipService.sendFriendRequest.mockRejectedValue(new Error('USER_NOT_FOUND'));

      await sendFriendRequest(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 when friendship already exists', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.body = { recipientId: 'u-2' };
      mockFriendshipService.sendFriendRequest.mockRejectedValue(new Error('FRIENDSHIP_EXISTS'));

      await sendFriendRequest(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when request already sent', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.body = { recipientId: 'u-2' };
      mockFriendshipService.sendFriendRequest.mockRejectedValue(new Error('REQUEST_ALREADY_SENT'));

      await sendFriendRequest(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Friend request already sent' })
      );
    });

    it('should return 400 when already friends', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.body = { recipientId: 'u-2' };
      mockFriendshipService.sendFriendRequest.mockRejectedValue(new Error('ALREADY_FRIENDS'));

      await sendFriendRequest(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Already friends' })
      );
    });

    it('should return 500 on unexpected error', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.body = { recipientId: 'u-2' };
      mockFriendshipService.sendFriendRequest.mockRejectedValue(new Error('DB error'));

      await sendFriendRequest(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── acceptFriendRequest ──────────────────────────────
  describe('acceptFriendRequest', () => {
    it('should accept friend request and return 200', async () => {
      mockReq.user = { userId: 'u-2', email: 'test@test.com' };
      mockReq.body = { requestId: 'f-1' };
      mockFriendshipService.acceptFriendRequest.mockResolvedValue({ id: 'f-1', status: 'ACCEPTED' });

      await acceptFriendRequest(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Friend request accepted' })
      );
    });

    it('should return 401 when not authenticated', async () => {
      mockReq.body = { requestId: 'f-1' };

      await acceptFriendRequest(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 when friendship not found', async () => {
      mockReq.user = { userId: 'u-2', email: 'test@test.com' };
      mockReq.body = { requestId: 'f-99' };
      mockFriendshipService.acceptFriendRequest.mockRejectedValue(new Error('FRIENDSHIP_NOT_FOUND'));

      await acceptFriendRequest(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 when not pending', async () => {
      mockReq.user = { userId: 'u-2', email: 'test@test.com' };
      mockReq.body = { requestId: 'f-1' };
      mockFriendshipService.acceptFriendRequest.mockRejectedValue(new Error('INVALID_STATUS'));

      await acceptFriendRequest(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 on unexpected error', async () => {
      mockReq.user = { userId: 'u-2', email: 'test@test.com' };
      mockReq.body = { requestId: 'f-1' };
      mockFriendshipService.acceptFriendRequest.mockRejectedValue(new Error('DB error'));

      await acceptFriendRequest(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── rejectFriendRequest ──────────────────────────────
  describe('rejectFriendRequest', () => {
    it('should reject friend request and return 200', async () => {
      mockReq.user = { userId: 'u-2', email: 'test@test.com' };
      mockReq.body = { requestId: 'f-1' };
      mockFriendshipService.rejectFriendRequest.mockResolvedValue(undefined);

      await rejectFriendRequest(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Friend request rejected successfully' })
      );
    });

    it('should return 401 when not authenticated', async () => {
      mockReq.body = { requestId: 'f-1' };

      await rejectFriendRequest(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 when friendship not found', async () => {
      mockReq.user = { userId: 'u-2', email: 'test@test.com' };
      mockReq.body = { requestId: 'f-99' };
      mockFriendshipService.rejectFriendRequest.mockRejectedValue(new Error('FRIENDSHIP_NOT_FOUND'));

      await rejectFriendRequest(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  // ─── removeFriend ──────────────────────────────
  describe('removeFriend', () => {
    it('should remove friend and return 200', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.body = { friendId: 'u-2' };
      mockFriendshipService.removeFriend.mockResolvedValue(undefined);

      await removeFriend(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Friend removed successfully' })
      );
    });

    it('should return 401 when not authenticated', async () => {
      mockReq.body = { friendId: 'u-2' };

      await removeFriend(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 when friendship not found', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.body = { friendId: 'u-99' };
      mockFriendshipService.removeFriend.mockRejectedValue(new Error('FRIENDSHIP_NOT_FOUND'));

      await removeFriend(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on unexpected error', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.body = { friendId: 'u-2' };
      mockFriendshipService.removeFriend.mockRejectedValue(new Error('DB error'));

      await removeFriend(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── listFriends ──────────────────────────────
  describe('listFriends', () => {
    it('should list friends with pagination', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.query = { page: '2', limit: '10' };
      mockFriendshipService.getFriends.mockResolvedValue({
        friends: [{ id: 'u-2', name: 'Jane' }],
        totalCount: 15,
      });

      await listFriends(mockReq as Request, mockRes as Response);

      expect(mockFriendshipService.getFriends).toHaveBeenCalledWith('u-1', 2, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: [{ id: 'u-2', name: 'Jane' }],
          pagination: expect.objectContaining({
            page: 2,
            limit: 10,
            totalCount: 15,
            totalPages: 2,
            hasMore: false,
          }),
        })
      );
    });

    it('should use default pagination when not provided', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.query = {};
      mockFriendshipService.getFriends.mockResolvedValue({
        friends: [],
        totalCount: 0,
      });

      await listFriends(mockReq as Request, mockRes as Response);

      expect(mockFriendshipService.getFriends).toHaveBeenCalledWith('u-1', 1, 20);
    });

    it('should return 401 when not authenticated', async () => {
      await listFriends(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 500 on unexpected error', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.query = {};
      mockFriendshipService.getFriends.mockRejectedValue(new Error('DB error'));

      await listFriends(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── listFriendRequests ──────────────────────────────
  describe('listFriendRequests', () => {
    it('should list pending friend requests with pagination', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.query = { page: '1', limit: '5' };
      mockFriendshipService.getPendingRequests.mockResolvedValue({
        requests: [{ id: 'f-1', senderId: 'u-2' }],
        totalCount: 1,
      });

      await listFriendRequests(mockReq as Request, mockRes as Response);

      expect(mockFriendshipService.getPendingRequests).toHaveBeenCalledWith('u-1', 1, 5);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: [{ id: 'f-1', senderId: 'u-2' }],
          pagination: expect.objectContaining({
            totalCount: 1,
            totalPages: 1,
            hasMore: false,
          }),
        })
      );
    });

    it('should return 401 when not authenticated', async () => {
      await listFriendRequests(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 500 on unexpected error', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.query = {};
      mockFriendshipService.getPendingRequests.mockRejectedValue(new Error('DB error'));

      await listFriendRequests(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
