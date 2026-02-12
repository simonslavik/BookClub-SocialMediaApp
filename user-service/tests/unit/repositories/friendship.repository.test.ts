import { jest } from '@jest/globals';
const mockPrisma = {
  friendship: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  default: mockPrisma,
}));

jest.mock('../../../src/constants/index.js', () => ({
  __esModule: true,
  USER_BASIC_FIELDS: { id: true, name: true, email: true, profileImage: true },
}));

// Mock FriendshipStatus enum from Prisma
jest.mock('@prisma/client', () => ({
  FriendshipStatus: {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
    BLOCKED: 'BLOCKED',
  },
}));

import { FriendshipRepository } from '../../../src/repositories/friendship.repository.js';

describe('FriendshipRepository', () => {
  afterEach(() => jest.clearAllMocks());

  describe('findByUserIds', () => {
    it('should find friendship by user and friend IDs', async () => {
      const mock = { id: 'f-1', userId: 'u-1', friendId: 'u-2', status: 'PENDING' };
      mockPrisma.friendship.findUnique.mockResolvedValue(mock);

      const result = await FriendshipRepository.findByUserIds('u-1', 'u-2');

      expect(mockPrisma.friendship.findUnique).toHaveBeenCalledWith({
        where: { userId_friendId: { userId: 'u-1', friendId: 'u-2' } },
      });
      expect(result).toEqual(mock);
    });
  });

  describe('findById', () => {
    it('should find friendship by ID', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValue({ id: 'f-1' });

      const result = await FriendshipRepository.findById('f-1');

      expect(mockPrisma.friendship.findUnique).toHaveBeenCalledWith({
        where: { id: 'f-1' },
      });
    });
  });

  describe('create', () => {
    it('should create a friendship with PENDING status', async () => {
      const mock = { id: 'f-1', userId: 'u-1', friendId: 'u-2', status: 'PENDING' };
      mockPrisma.friendship.create.mockResolvedValue(mock);

      const result = await FriendshipRepository.create('u-1', 'u-2');

      expect(mockPrisma.friendship.create).toHaveBeenCalledWith({
        data: { userId: 'u-1', friendId: 'u-2', status: 'PENDING' },
      });
      expect(result.status).toBe('PENDING');
    });
  });

  describe('updateStatus', () => {
    it('should update friendship status', async () => {
      mockPrisma.friendship.update.mockResolvedValue({ id: 'f-1', status: 'ACCEPTED' });

      const result = await FriendshipRepository.updateStatus('f-1', 'ACCEPTED' as any);

      expect(mockPrisma.friendship.update).toHaveBeenCalledWith({
        where: { id: 'f-1' },
        data: { status: 'ACCEPTED' },
      });
    });
  });

  describe('delete', () => {
    it('should delete friendship', async () => {
      mockPrisma.friendship.delete.mockResolvedValue({ id: 'f-1' });

      await FriendshipRepository.delete('f-1');

      expect(mockPrisma.friendship.delete).toHaveBeenCalledWith({
        where: { id: 'f-1' },
      });
    });
  });

  describe('getPendingRequests', () => {
    it('should get pending requests for user', async () => {
      mockPrisma.friendship.findMany.mockResolvedValue([
        { id: 'f-1', userId: 'u-2', friendId: 'u-1', status: 'PENDING', user: { name: 'User2' } },
      ]);

      const result = await FriendshipRepository.getPendingRequests('u-1');

      expect(mockPrisma.friendship.findMany).toHaveBeenCalledWith({
        where: { friendId: 'u-1', status: 'PENDING' },
        include: { user: { select: expect.any(Object) } },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('areFriends', () => {
    it('should return true when friendship with ACCEPTED status exists', async () => {
      mockPrisma.friendship.findFirst.mockResolvedValue({ id: 'f-1', status: 'ACCEPTED' });

      const result = await FriendshipRepository.areFriends('u-1', 'u-2');

      expect(result).toBe(true);
    });

    it('should return false when no accepted friendship exists', async () => {
      mockPrisma.friendship.findFirst.mockResolvedValue(null);

      const result = await FriendshipRepository.areFriends('u-1', 'u-2');

      expect(result).toBe(false);
    });
  });

  describe('getFriendshipStatus', () => {
    it('should return "friends" when accepted', async () => {
      mockPrisma.friendship.findFirst
        .mockResolvedValueOnce({ id: 'f-1', status: 'ACCEPTED' });

      const result = await FriendshipRepository.getFriendshipStatus('u-1', 'u-2');

      expect(result).toBe('friends');
    });

    it('should return "request_sent" when current user sent request', async () => {
      mockPrisma.friendship.findFirst
        .mockResolvedValueOnce(null) // no accepted
        .mockResolvedValueOnce({ id: 'f-1', userId: 'u-1', friendId: 'u-2', status: 'PENDING' });

      const result = await FriendshipRepository.getFriendshipStatus('u-1', 'u-2');

      expect(result).toBe('request_sent');
    });

    it('should return "request_received" when target user sent request', async () => {
      mockPrisma.friendship.findFirst
        .mockResolvedValueOnce(null) // no accepted
        .mockResolvedValueOnce({ id: 'f-1', userId: 'u-2', friendId: 'u-1', status: 'PENDING' });

      const result = await FriendshipRepository.getFriendshipStatus('u-1', 'u-2');

      expect(result).toBe('request_received');
    });

    it('should return null when no relationship exists', async () => {
      mockPrisma.friendship.findFirst
        .mockResolvedValueOnce(null) // no accepted
        .mockResolvedValueOnce(null); // no pending

      const result = await FriendshipRepository.getFriendshipStatus('u-1', 'u-2');

      expect(result).toBeNull();
    });
  });

  describe('countFriends', () => {
    it('should count accepted friendships', async () => {
      mockPrisma.friendship.count.mockResolvedValue(5);

      const result = await FriendshipRepository.countFriends('u-1');

      expect(result).toBe(5);
      expect(mockPrisma.friendship.count).toHaveBeenCalledWith({
        where: {
          OR: [{ userId: 'u-1' }, { friendId: 'u-1' }],
          status: 'ACCEPTED',
        },
      });
    });
  });
});
