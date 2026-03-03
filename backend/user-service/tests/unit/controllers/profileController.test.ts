import { jest } from '@jest/globals';
import { Request, Response } from 'express';

// Mock dependencies before imports
jest.mock('../../../src/utils/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  logError: jest.fn(),
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockUserService = {
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  listAllUsers: jest.fn(),
  getUsersByIds: jest.fn(),
};

const mockFriendshipService = {
  getFriendshipStatus: jest.fn(),
  countFriends: jest.fn(),
};

jest.mock('../../../src/services/user.service.js', () => ({
  UserService: mockUserService,
}));

jest.mock('../../../src/services/friendship.service.js', () => ({
  FriendshipService: mockFriendshipService,
}));

jest.mock('../../../src/utils/errors.js', () => {
  class NotFoundError extends Error {
    statusCode = 404;
    constructor(msg: string) { super(msg); this.name = 'NotFoundError'; }
  }
  class BadRequestError extends Error {
    statusCode = 400;
    constructor(msg: string) { super(msg); this.name = 'BadRequestError'; }
  }
  class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(msg: string) { super(msg); this.name = 'UnauthorizedError'; }
  }
  return { NotFoundError, BadRequestError, UnauthorizedError };
});

import {
  getProfileById,
  updateMyProfile,
  getUserById,
  listUsers,
  getUsersByIds,
} from '../../../src/controllers/profileController.js';

describe('ProfileController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
      user: undefined,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => jest.clearAllMocks());

  describe('getProfileById', () => {
    it('should return user profile with friendship status', async () => {
      mockReq.params = { userId: 'u-2' };
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockUserService.getProfile.mockResolvedValue({
        id: 'u-2',
        name: 'John',
        email: 'john@test.com',
      });
      mockFriendshipService.getFriendshipStatus.mockResolvedValue('friends');
      mockFriendshipService.countFriends.mockResolvedValue(5);

      await getProfileById(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            name: 'John',
            friendshipStatus: 'friends',
            numberOfFriends: 5,
          }),
        })
      );
    });

    it('should not check friendship when viewing own profile', async () => {
      mockReq.params = { userId: 'u-1' };
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockUserService.getProfile.mockResolvedValue({ id: 'u-1', name: 'Me' });
      mockFriendshipService.countFriends.mockResolvedValue(3);

      await getProfileById(mockReq as Request, mockRes as Response);

      expect(mockFriendshipService.getFriendshipStatus).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            friendshipStatus: null,
            numberOfFriends: 3,
          }),
        })
      );
    });

    it('should throw BadRequestError when userId is missing', async () => {
      mockReq.params = {};

      await expect(getProfileById(mockReq as Request, mockRes as Response))
        .rejects.toThrow('User ID is required');
    });

    it('should throw NotFoundError when user not found', async () => {
      mockReq.params = { userId: 'nonexistent' };
      mockUserService.getProfile.mockResolvedValue(null);

      await expect(getProfileById(mockReq as Request, mockRes as Response))
        .rejects.toThrow('User not found');
    });
  });

  describe('updateMyProfile', () => {
    it('should update profile', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.body = { name: 'New Name' };
      mockUserService.updateProfile.mockResolvedValue({ id: 'u-1', name: 'New Name' });

      await updateMyProfile(mockReq as Request, mockRes as Response);

      expect(mockUserService.updateProfile).toHaveBeenCalledWith('u-1', { name: 'New Name' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should throw UnauthorizedError when not authenticated', async () => {
      mockReq.body = { name: 'Test' };

      await expect(updateMyProfile(mockReq as Request, mockRes as Response))
        .rejects.toThrow('User not authenticated');
    });

    it('should throw BadRequestError when name is empty', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockReq.body = { name: '   ' };

      await expect(updateMyProfile(mockReq as Request, mockRes as Response))
        .rejects.toThrow('Name is required');
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      mockReq.params = { id: 'u-1' };
      mockUserService.getProfile.mockResolvedValue({ id: 'u-1', name: 'John' });

      await getUserById(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ name: 'John' }) })
      );
    });

    it('should throw NotFoundError when user not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockUserService.getProfile.mockResolvedValue(null);

      await expect(getUserById(mockReq as Request, mockRes as Response))
        .rejects.toThrow('User not found');
    });
  });

  describe('listUsers', () => {
    it('should return all users with count', async () => {
      mockUserService.listAllUsers.mockResolvedValue([
        { id: 'u-1', name: 'John' },
        { id: 'u-2', name: 'Jane' },
      ]);

      await listUsers(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, count: 2 })
      );
    });
  });

  describe('getUsersByIds', () => {
    it('should return users mapped with username field', async () => {
      mockReq.body = { userIds: ['u-1', 'u-2'] };
      mockUserService.getUsersByIds.mockResolvedValue([
        { id: 'u-1', name: 'John', email: 'john@test.com', profileImage: null },
      ]);

      await getUsersByIds(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          users: [
            expect.objectContaining({
              id: 'u-1',
              username: 'John',
              email: 'john@test.com',
            }),
          ],
        })
      );
    });

    it('should throw BadRequestError when userIds is not an array', async () => {
      mockReq.body = { userIds: 'not-array' };

      await expect(getUsersByIds(mockReq as Request, mockRes as Response))
        .rejects.toThrow('userIds must be a non-empty array');
    });

    it('should throw BadRequestError when userIds is empty', async () => {
      mockReq.body = { userIds: [] };

      await expect(getUsersByIds(mockReq as Request, mockRes as Response))
        .rejects.toThrow('userIds must be a non-empty array');
    });
  });
});
