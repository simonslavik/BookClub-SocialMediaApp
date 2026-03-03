import { jest } from '@jest/globals';
const mockPrisma = {
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
};

jest.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  default: mockPrisma,
}));

import { TokenRepository } from '../../../src/repositories/token.repository.js';

describe('TokenRepository', () => {
  afterEach(() => jest.clearAllMocks());

  describe('createRefreshToken', () => {
    it('should create a refresh token', async () => {
      const expires = new Date();
      const mock = { id: 'rt-1', userId: 'u-1', token: 'tok', expiresAt: expires };
      mockPrisma.refreshToken.create.mockResolvedValue(mock);

      const result = await TokenRepository.createRefreshToken('u-1', 'tok', expires);

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: { userId: 'u-1', token: 'tok', expiresAt: expires },
      });
      expect(result).toEqual(mock);
    });
  });

  describe('findRefreshToken', () => {
    it('should find refresh token with user included', async () => {
      const mock = { id: 'rt-1', token: 'tok', user: { id: 'u-1' } };
      mockPrisma.refreshToken.findUnique.mockResolvedValue(mock);

      const result = await TokenRepository.findRefreshToken('tok');

      expect(mockPrisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'tok' },
        include: { user: true },
      });
      expect(result).toEqual(mock);
    });

    it('should return null when token not found', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      const result = await TokenRepository.findRefreshToken('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('deleteRefreshToken', () => {
    it('should delete a specific refresh token', async () => {
      mockPrisma.refreshToken.delete.mockResolvedValue({ id: 'rt-1' });

      await TokenRepository.deleteRefreshToken('tok');

      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { token: 'tok' },
      });
    });
  });

  describe('deleteAllUserTokens', () => {
    it('should delete all tokens for a user', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      await TokenRepository.deleteAllUserTokens('u-1');

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u-1' },
      });
    });
  });

  describe('deleteExpiredTokens', () => {
    it('should delete expired tokens', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 5 });

      const result = await TokenRepository.deleteExpiredTokens();

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { expiresAt: { lt: expect.any(Date) } },
      });
    });
  });
});
