import { jest } from '@jest/globals';
// Mock dependencies
jest.mock('../../../src/utils/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  logError: jest.fn(),
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockFriendshipRepo = {
  findByUserIds: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
  delete: jest.fn(),
  getAcceptedFriends: jest.fn(),
  getPendingRequests: jest.fn(),
  getSentRequests: jest.fn(),
  areFriends: jest.fn(),
  getFriendshipStatus: jest.fn(),
  countFriends: jest.fn(),
};

const mockUserRepo = {
  findById: jest.fn(),
};

jest.mock('../../../src/repositories/friendship.repository.js', () => ({
  FriendshipRepository: mockFriendshipRepo,
}));

jest.mock('../../../src/repositories/user.repository.js', () => ({
  UserRepository: mockUserRepo,
}));

jest.mock('@prisma/client', () => ({
  FriendshipStatus: {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
    BLOCKED: 'BLOCKED',
  },
}));

import { FriendshipService } from '../../../src/services/friendship.service.js';

describe('FriendshipService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('sendFriendRequest', () => {
    it('should throw when user tries to add themselves', async () => {
      await expect(FriendshipService.sendFriendRequest('u-1', 'u-1'))
        .rejects.toThrow('CANNOT_ADD_SELF');
    });

    it('should throw when friend user does not exist', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(FriendshipService.sendFriendRequest('u-1', 'u-2'))
        .rejects.toThrow('USER_NOT_FOUND');
    });

    it('should throw when friendship already exists', async () => {
      mockUserRepo.findById.mockResolvedValue({ id: 'u-2' });
      mockFriendshipRepo.findByUserIds.mockResolvedValue({ id: 'f-1' });

      await expect(FriendshipService.sendFriendRequest('u-1', 'u-2'))
        .rejects.toThrow('FRIENDSHIP_EXISTS');
    });

    it('should auto-accept when reverse pending request exists', async () => {
      mockUserRepo.findById.mockResolvedValue({ id: 'u-2' });
      mockFriendshipRepo.findByUserIds
        .mockResolvedValueOnce(null)  // forward check
        .mockResolvedValueOnce({ id: 'f-1', status: 'PENDING' }); // reverse check
      mockFriendshipRepo.updateStatus.mockResolvedValue(undefined);

      const result = await FriendshipService.sendFriendRequest('u-1', 'u-2');

      expect(mockFriendshipRepo.updateStatus).toHaveBeenCalledWith('f-1', 'ACCEPTED');
      expect(result.message).toContain('accepted automatically');
    });

    it('should create new friend request', async () => {
      mockUserRepo.findById.mockResolvedValue({ id: 'u-2' });
      mockFriendshipRepo.findByUserIds
        .mockResolvedValueOnce(null)  // forward
        .mockResolvedValueOnce(null); // reverse
      mockFriendshipRepo.create.mockResolvedValue({ id: 'f-1', status: 'PENDING' });

      const result = await FriendshipService.sendFriendRequest('u-1', 'u-2');

      expect(mockFriendshipRepo.create).toHaveBeenCalledWith('u-1', 'u-2');
      expect(result.status).toBe('PENDING');
    });
  });

  describe('acceptFriendRequest', () => {
    it('should throw when friendship not found', async () => {
      mockFriendshipRepo.findById.mockResolvedValue(null);

      await expect(FriendshipService.acceptFriendRequest('u-1', 'f-1'))
        .rejects.toThrow('FRIENDSHIP_NOT_FOUND');
    });

    it('should throw when user is not the receiver', async () => {
      mockFriendshipRepo.findById.mockResolvedValue({
        id: 'f-1',
        userId: 'u-2',
        friendId: 'u-3', // not u-1
        status: 'PENDING',
      });

      await expect(FriendshipService.acceptFriendRequest('u-1', 'f-1'))
        .rejects.toThrow('UNAUTHORIZED');
    });

    it('should throw when request is not pending', async () => {
      mockFriendshipRepo.findById.mockResolvedValue({
        id: 'f-1',
        userId: 'u-2',
        friendId: 'u-1',
        status: 'ACCEPTED',
      });

      await expect(FriendshipService.acceptFriendRequest('u-1', 'f-1'))
        .rejects.toThrow('INVALID_STATUS');
    });

    it('should accept pending request', async () => {
      mockFriendshipRepo.findById.mockResolvedValue({
        id: 'f-1',
        userId: 'u-2',
        friendId: 'u-1',
        status: 'PENDING',
      });
      mockFriendshipRepo.updateStatus.mockResolvedValue({ id: 'f-1', status: 'ACCEPTED' });

      const result = await FriendshipService.acceptFriendRequest('u-1', 'f-1');

      expect(mockFriendshipRepo.updateStatus).toHaveBeenCalledWith('f-1', 'ACCEPTED');
    });
  });

  describe('rejectFriendRequest', () => {
    it('should throw when friendship not found', async () => {
      mockFriendshipRepo.findById.mockResolvedValue(null);

      await expect(FriendshipService.rejectFriendRequest('u-1', 'f-1'))
        .rejects.toThrow('FRIENDSHIP_NOT_FOUND');
    });

    it('should throw when user is not the receiver', async () => {
      mockFriendshipRepo.findById.mockResolvedValue({
        id: 'f-1',
        userId: 'u-2',
        friendId: 'u-3',
      });

      await expect(FriendshipService.rejectFriendRequest('u-1', 'f-1'))
        .rejects.toThrow('UNAUTHORIZED');
    });

    it('should delete the friendship on rejection', async () => {
      mockFriendshipRepo.findById.mockResolvedValue({
        id: 'f-1',
        userId: 'u-2',
        friendId: 'u-1',
      });
      mockFriendshipRepo.delete.mockResolvedValue(undefined);

      const result = await FriendshipService.rejectFriendRequest('u-1', 'f-1');

      expect(mockFriendshipRepo.delete).toHaveBeenCalledWith('f-1');
      expect(result.message).toContain('rejected');
    });
  });

  describe('removeFriend', () => {
    it('should throw when friendship not found', async () => {
      mockFriendshipRepo.findByUserIds.mockResolvedValue(null);

      await expect(FriendshipService.removeFriend('u-1', 'u-2'))
        .rejects.toThrow('FRIENDSHIP_NOT_FOUND');
    });

    it('should throw when not friends (not ACCEPTED)', async () => {
      mockFriendshipRepo.findByUserIds.mockResolvedValue({
        id: 'f-1',
        status: 'PENDING',
      });

      await expect(FriendshipService.removeFriend('u-1', 'u-2'))
        .rejects.toThrow('NOT_FRIENDS');
    });

    it('should remove accepted friendship', async () => {
      mockFriendshipRepo.findByUserIds.mockResolvedValue({
        id: 'f-1',
        status: 'ACCEPTED',
      });
      mockFriendshipRepo.delete.mockResolvedValue(undefined);

      const result = await FriendshipService.removeFriend('u-1', 'u-2');

      expect(mockFriendshipRepo.delete).toHaveBeenCalledWith('f-1');
      expect(result.message).toContain('removed');
    });
  });

  describe('blockUser', () => {
    it('should throw when friendship not found', async () => {
      mockFriendshipRepo.findById.mockResolvedValue(null);

      await expect(FriendshipService.blockUser('u-1', 'f-1'))
        .rejects.toThrow('FRIENDSHIP_NOT_FOUND');
    });

    it('should throw when user is not a participant', async () => {
      mockFriendshipRepo.findById.mockResolvedValue({
        id: 'f-1',
        userId: 'u-3',
        friendId: 'u-4',
      });

      await expect(FriendshipService.blockUser('u-1', 'f-1'))
        .rejects.toThrow('UNAUTHORIZED');
    });

    it('should block user', async () => {
      mockFriendshipRepo.findById.mockResolvedValue({
        id: 'f-1',
        userId: 'u-1',
        friendId: 'u-2',
      });
      mockFriendshipRepo.updateStatus.mockResolvedValue({ id: 'f-1', status: 'BLOCKED' });

      const result = await FriendshipService.blockUser('u-1', 'f-1');

      expect(mockFriendshipRepo.updateStatus).toHaveBeenCalledWith('f-1', 'BLOCKED');
    });
  });

  describe('getFriends', () => {
    it('should return paginated friends', async () => {
      mockFriendshipRepo.getAcceptedFriends.mockResolvedValue([
        {
          id: 'f-1',
          userId: 'u-1',
          friendId: 'u-2',
          createdAt: new Date(),
          user: { id: 'u-1', name: 'User1' },
          friend: { id: 'u-2', name: 'User2' },
        },
      ]);

      const result = await FriendshipService.getFriends('u-1', 1, 10);

      expect(result.friends).toHaveLength(1);
      expect(result.friends[0].friend.name).toBe('User2');
      expect(result.totalCount).toBe(1);
    });

    it('should return friend (not self) in mapped result', async () => {
      mockFriendshipRepo.getAcceptedFriends.mockResolvedValue([
        {
          id: 'f-1',
          userId: 'u-2',
          friendId: 'u-1', // u-1 is the current user
          createdAt: new Date(),
          user: { id: 'u-2', name: 'User2' },
          friend: { id: 'u-1', name: 'User1' },
        },
      ]);

      const result = await FriendshipService.getFriends('u-1', 1, 10);

      // Should return u-2 (the other user), not u-1
      expect(result.friends[0].friend.name).toBe('User2');
    });
  });

  describe('getPendingRequests', () => {
    it('should return paginated pending requests', async () => {
      mockFriendshipRepo.getPendingRequests.mockResolvedValue([
        { id: 'f-1', user: { name: 'Requester' }, createdAt: new Date() },
      ]);

      const result = await FriendshipService.getPendingRequests('u-1');

      expect(result.requests).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });
  });

  describe('areFriends', () => {
    it('should delegate to repository', async () => {
      mockFriendshipRepo.areFriends.mockResolvedValue(true);

      const result = await FriendshipService.areFriends('u-1', 'u-2');

      expect(result).toBe(true);
      expect(mockFriendshipRepo.areFriends).toHaveBeenCalledWith('u-1', 'u-2');
    });
  });

  describe('getFriendshipStatus', () => {
    it('should delegate to repository', async () => {
      mockFriendshipRepo.getFriendshipStatus.mockResolvedValue('friends');

      const result = await FriendshipService.getFriendshipStatus('u-1', 'u-2');

      expect(result).toBe('friends');
    });
  });

  describe('countFriends', () => {
    it('should delegate to repository', async () => {
      mockFriendshipRepo.countFriends.mockResolvedValue(10);

      const result = await FriendshipService.countFriends('u-1');

      expect(result).toBe(10);
    });
  });
});
