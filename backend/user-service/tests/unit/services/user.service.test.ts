import { jest } from '@jest/globals';
// Mock dependencies
jest.mock('../../../src/utils/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  logError: jest.fn(),
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockUserRepo = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  search: jest.fn(),
  findAll: jest.fn(),
  findManyByIds: jest.fn(),
};

jest.mock('../../../src/repositories/user.repository.js', () => ({
  UserRepository: mockUserRepo,
}));

import { UserService } from '../../../src/services/user.service.js';

describe('UserService', () => {
  afterEach(() => jest.clearAllMocks());

  const mockUser = {
    id: 'user-1',
    name: 'John',
    email: 'john@test.com',
    profileImage: null,
    createdAt: new Date(),
  };

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser);

      const result = await UserService.getProfile('user-1');

      expect(mockUserRepo.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
    });

    it('should throw when user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(UserService.getProfile('nonexistent')).rejects.toThrow('USER_NOT_FOUND');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updated = { ...mockUser, name: 'Jane' };
      mockUserRepo.update.mockResolvedValue(updated);

      const result = await UserService.updateProfile('user-1', { name: 'Jane' });

      expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', { name: 'Jane' });
      expect(result.name).toBe('Jane');
    });
  });

  describe('updateProfileImage', () => {
    it('should update profile image', async () => {
      const updated = { ...mockUser, profileImage: '/uploads/new.jpg' };
      mockUserRepo.update.mockResolvedValue(updated);

      const result = await UserService.updateProfileImage('user-1', '/uploads/new.jpg');

      expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', { profileImage: '/uploads/new.jpg' });
      expect(result.profileImage).toBe('/uploads/new.jpg');
    });
  });

  describe('deleteProfileImage', () => {
    it('should set profile image to null', async () => {
      const updated = { ...mockUser, profileImage: null };
      mockUserRepo.update.mockResolvedValue(updated);

      const result = await UserService.deleteProfileImage('user-1');

      expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', { profileImage: null });
      expect(result.profileImage).toBeNull();
    });
  });

  describe('searchUsers', () => {
    it('should search users with default limit', async () => {
      mockUserRepo.search.mockResolvedValue([mockUser]);

      const result = await UserService.searchUsers('john');

      expect(mockUserRepo.search).toHaveBeenCalledWith('john', 10);
      expect(result).toHaveLength(1);
    });

    it('should search users with custom limit', async () => {
      mockUserRepo.search.mockResolvedValue([]);

      await UserService.searchUsers('test', 5);

      expect(mockUserRepo.search).toHaveBeenCalledWith('test', 5);
    });
  });

  describe('listAllUsers', () => {
    it('should return all users', async () => {
      mockUserRepo.findAll.mockResolvedValue([mockUser]);

      const result = await UserService.listAllUsers();

      expect(mockUserRepo.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('getUsersByIds', () => {
    it('should return users by IDs', async () => {
      mockUserRepo.findManyByIds.mockResolvedValue([mockUser]);

      const result = await UserService.getUsersByIds(['user-1']);

      expect(mockUserRepo.findManyByIds).toHaveBeenCalledWith(['user-1']);
      expect(result).toHaveLength(1);
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account', async () => {
      mockUserRepo.delete.mockResolvedValue(undefined);

      const result = await UserService.deleteAccount('user-1');

      expect(mockUserRepo.delete).toHaveBeenCalledWith('user-1');
      expect(result.message).toContain('deleted');
    });
  });
});
