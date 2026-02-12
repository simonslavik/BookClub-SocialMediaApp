import { jest } from '@jest/globals';
import { Request, Response } from 'express';

// Mock dependencies before imports
jest.mock('../../../src/utils/logger.js', () => {
  const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  return { __esModule: true, default: mockLogger, logger: mockLogger, logError: jest.fn() };
});

const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock('../../../src/config/database.js', () => ({
  __esModule: true,
  default: mockPrisma,
}));

const mockGenerateTokens = jest.fn();

jest.mock('../../../src/utils/tokenUtils.js', () => ({
  generateTokens: mockGenerateTokens,
}));

// Mock google-auth-library
const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

import { googleAuth } from '../../../src/controllers/googleAuthController.js';

describe('GoogleAuthController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = { body: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => jest.clearAllMocks());

  describe('googleAuth', () => {
    it('should create new user when google user does not exist', async () => {
      mockReq.body = { credential: 'google-token' };
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-123',
          email: 'john@gmail.com',
          name: 'John',
          picture: 'https://pic.url',
        }),
      });
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'u-1',
        email: 'john@gmail.com',
        name: 'John',
        googleId: 'google-123',
        authProvider: 'google',
        profileImage: 'https://pic.url',
        createdAt: new Date(),
      });
      mockGenerateTokens.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
      });

      await googleAuth(mockReq as Request, mockRes as Response);

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'john@gmail.com',
            googleId: 'google-123',
            authProvider: 'google',
          }),
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Google authentication successful',
          accessToken: 'at',
          refreshToken: 'rt',
        })
      );
    });

    it('should link google account when user exists without googleId', async () => {
      mockReq.body = { credential: 'google-token' };
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-123',
          email: 'john@test.com',
          name: 'John',
          picture: 'https://pic.url',
        }),
      });
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'u-1',
        email: 'john@test.com',
        name: 'John',
        googleId: null,
        authProvider: 'local',
        profileImage: null,
        createdAt: new Date(),
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'u-1',
        email: 'john@test.com',
        name: 'John',
        googleId: 'google-123',
        authProvider: 'google',
        profileImage: 'https://pic.url',
        createdAt: new Date(),
      });
      mockGenerateTokens.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
      });

      await googleAuth(mockReq as Request, mockRes as Response);

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u-1' },
          data: expect.objectContaining({
            googleId: 'google-123',
            authProvider: 'google',
          }),
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should login existing google user without creating/updating', async () => {
      mockReq.body = { credential: 'google-token' };
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-123',
          email: 'john@gmail.com',
          name: 'John',
          picture: 'https://pic.url',
        }),
      });
      const existingUser = {
        id: 'u-1',
        email: 'john@gmail.com',
        name: 'John',
        googleId: 'google-123',
        authProvider: 'google',
        profileImage: 'https://pic.url',
        createdAt: new Date(),
      };
      mockPrisma.user.findFirst.mockResolvedValue(existingUser);
      mockGenerateTokens.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
      });

      await googleAuth(mockReq as Request, mockRes as Response);

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 401 when google token payload is null', async () => {
      mockReq.body = { credential: 'bad-token' };
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => null,
      });

      await googleAuth(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid Google token' })
      );
    });

    it('should return 400 when email or name missing from payload', async () => {
      mockReq.body = { credential: 'token' };
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-123',
          email: null,
          name: null,
        }),
      });

      await googleAuth(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Email and name are required from Google' })
      );
    });

    it('should return 500 on unexpected error', async () => {
      mockReq.body = { credential: 'token' };
      mockVerifyIdToken.mockRejectedValue(new Error('Network error'));

      await googleAuth(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Error authenticating with Google' })
      );
    });
  });
});
