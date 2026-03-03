import { jest } from '@jest/globals';
// Mock Prisma before importing
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  default: mockPrisma,
}));

jest.mock('../../../src/constants/index.js', () => ({
  __esModule: true,
  USER_PUBLIC_FIELDS: { id: true, name: true, email: true, profileImage: true, createdAt: true },
  USER_BASIC_FIELDS: { id: true, name: true, email: true, profileImage: true },
}));

import { UserRepository } from '../../../src/repositories/user.repository.js';

describe('UserRepository', () => {
  afterEach(() => jest.clearAllMocks());

  const mockUser = {
    id: 'user-1',
    name: 'John',
    email: 'john@test.com',
    profileImage: null,
    createdAt: new Date(),
  };

  describe('findById', () => {
    it('should find user by id with public fields by default', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await UserRepository.findById('user-1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { id: true, name: true, email: true, profileImage: true, createdAt: true },
      });
      expect(result).toEqual(mockUser);
    });

    it('should find user without select when includePublicOnly is false', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, password: 'hashed' });

      const result = await UserRepository.findById('user-1', false);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: undefined,
      });
      expect(result).toHaveProperty('password');
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await UserRepository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await UserRepository.findByEmail('john@test.com');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@test.com' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByGoogleId', () => {
    it('should find user by Google ID', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await UserRepository.findByGoogleId('google-123');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { googleId: 'google-123' },
      });
    });
  });

  describe('create', () => {
    it('should create user with public fields selection', async () => {
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await UserRepository.create({
        name: 'John',
        email: 'john@test.com',
        password: 'hashed-password',
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { name: 'John', email: 'john@test.com', password: 'hashed-password' },
        select: expect.objectContaining({ id: true, name: true }),
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, name: 'Jane' });

      const result = await UserRepository.update('user-1', { name: 'Jane' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'Jane' },
        select: expect.objectContaining({ id: true }),
      });
      expect(result.name).toBe('Jane');
    });
  });

  describe('updatePassword', () => {
    it('should update password with public fields selection', async () => {
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await UserRepository.updatePassword('user-1', 'new-hash');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { password: 'new-hash' },
        select: expect.objectContaining({ id: true }),
      });
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      mockPrisma.user.delete.mockResolvedValue(mockUser);

      await UserRepository.delete('user-1');

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });
  });

  describe('search', () => {
    it('should search users by name or email', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await UserRepository.search('john');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'john', mode: 'insensitive' } },
            { email: { contains: 'john', mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, email: true, profileImage: true },
        take: 10,
      });
      expect(result).toHaveLength(1);
    });

    it('should respect custom limit', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await UserRepository.search('test', 5);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      );
    });
  });

  describe('findAll', () => {
    it('should return all users ordered by createdAt desc', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await UserRepository.findAll();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        select: expect.objectContaining({ id: true, createdAt: true }),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findManyByIds', () => {
    it('should find multiple users by IDs', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await UserRepository.findManyByIds(['user-1', 'user-2']);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['user-1', 'user-2'] } },
        select: { id: true, name: true, email: true, profileImage: true },
      });
    });
  });

  describe('setEmailVerificationToken', () => {
    it('should set email verification token', async () => {
      const expires = new Date();
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await UserRepository.setEmailVerificationToken('user-1', 'hash-token', expires);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          emailVerificationToken: 'hash-token',
          emailVerificationExpires: expires,
        },
      });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and clear token', async () => {
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await UserRepository.verifyEmail('user-1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
      });
    });
  });

  describe('setPasswordResetToken', () => {
    it('should set password reset token', async () => {
      const expires = new Date();
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await UserRepository.setPasswordResetToken('user-1', 'hash-token', expires);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          passwordResetToken: 'hash-token',
          passwordResetExpires: expires,
        },
      });
    });
  });

  describe('clearPasswordResetToken', () => {
    it('should clear password reset token', async () => {
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await UserRepository.clearPasswordResetToken('user-1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });
    });
  });
});
