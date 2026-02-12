import { jest } from '@jest/globals';
import { Request, Response } from 'express';

// Mock dependencies before imports
jest.mock('../../../src/utils/logger.js', () => {
  const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  return { __esModule: true, default: mockLogger, logger: mockLogger, logError: jest.fn() };
});

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  revokeAllRefreshTokens: jest.fn(),
};

jest.mock('../../../src/services/auth.service.js', () => ({
  AuthService: mockAuthService,
}));

const mockVerifyRefreshToken = jest.fn();
const mockGenerateAccessToken = jest.fn();
const mockGenerateRefreshToken = jest.fn();

jest.mock('../../../src/utils/tokenUtils.js', () => ({
  verifyRefreshToken: mockVerifyRefreshToken,
  generateAccessToken: mockGenerateAccessToken,
  generateRefreshToken: mockGenerateRefreshToken,
}));

jest.mock('../../../src/utils/errors.js', () => {
  class ConflictError extends Error {
    statusCode = 409;
    constructor(msg: string) { super(msg); this.name = 'ConflictError'; }
  }
  class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(msg: string) { super(msg); this.name = 'UnauthorizedError'; }
  }
  class NotFoundError extends Error {
    statusCode = 404;
    constructor(msg: string) { super(msg); this.name = 'NotFoundError'; }
  }
  return { ConflictError, UnauthorizedError, NotFoundError };
});

jest.mock('../../../src/utils/responseHelpers.js', () => ({
  sendCreated: jest.fn((res: any, data: any, msg: string) => res.status(201).json({ success: true, message: msg, data })),
  sendSuccess: jest.fn((res: any, data: any, msg: string) => res.status(200).json({ success: true, message: msg, data })),
  sendServerError: jest.fn((res: any, msg: string) => res.status(500).json({ success: false, message: msg })),
}));

jest.mock('../../../src/constants/index.js', () => ({
  LogType: {
    REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',
    TOKEN_REFRESHED: 'TOKEN_REFRESHED',
    USER_LOGOUT: 'USER_LOGOUT',
    USER_LOGOUT_ALL_DEVICES: 'USER_LOGOUT_ALL_DEVICES',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
  },
  SuccessMessage: {
    USER_REGISTERED: 'User registered successfully.',
    LOGIN_SUCCESS: 'Login successful',
    TOKEN_REFRESHED: 'Token refreshed successfully',
    LOGOUT_SUCCESS: 'Logged out successfully',
    LOGOUT_ALL_SUCCESS: 'Logged out from all devices successfully',
  },
}));

// Mock authController (sendVerificationEmail is imported from there)
jest.mock('../../../src/controllers/authController.js', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllDevices,
} from '../../../src/controllers/userController.js';

describe('UserController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = { body: {}, user: undefined, headers: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => jest.clearAllMocks());

  describe('registerUser', () => {
    it('should register user and return 201', async () => {
      mockReq.body = { name: 'John', email: 'john@test.com', password: 'Pass123!' };
      mockAuthService.register.mockResolvedValue({
        user: { id: 'u-1', email: 'john@test.com' },
        accessToken: 'at',
        refreshToken: 'rt',
      });

      await registerUser(mockReq as Request, mockRes as Response);

      expect(mockAuthService.register).toHaveBeenCalledWith('John', 'john@test.com', 'Pass123!');
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should re-throw ConflictError', async () => {
      mockReq.body = { name: 'John', email: 'john@test.com', password: 'Pass123!' };
      const { ConflictError } = await import('../../../src/utils/errors.js');
      mockAuthService.register.mockRejectedValue(new ConflictError('Email exists'));

      await expect(registerUser(mockReq as Request, mockRes as Response))
        .rejects.toThrow('Email exists');
    });

    it('should re-throw unknown errors', async () => {
      mockReq.body = { name: 'John', email: 'john@test.com', password: 'Pass123!' };
      mockAuthService.register.mockRejectedValue(new Error('DB down'));

      await expect(registerUser(mockReq as Request, mockRes as Response))
        .rejects.toThrow('DB down');
    });
  });

  describe('loginUser', () => {
    it('should login user and return 200', async () => {
      mockReq.body = { email: 'john@test.com', password: 'Pass123!' };
      mockAuthService.login.mockResolvedValue({
        user: { id: 'u-1' },
        accessToken: 'at',
        refreshToken: 'rt',
      });

      await loginUser(mockReq as Request, mockRes as Response);

      expect(mockAuthService.login).toHaveBeenCalledWith('john@test.com', 'Pass123!');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should re-throw UnauthorizedError', async () => {
      mockReq.body = { email: 'john@test.com', password: 'wrong' };
      const { UnauthorizedError } = await import('../../../src/utils/errors.js');
      mockAuthService.login.mockRejectedValue(new UnauthorizedError('Invalid credentials'));

      await expect(loginUser(mockReq as Request, mockRes as Response))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshAccessToken', () => {
    it('should return new tokens when refresh token is valid', async () => {
      mockReq.body = { refreshToken: 'valid-rt' };
      mockVerifyRefreshToken.mockResolvedValue({ id: 'u-1', email: 'john@test.com' });
      mockGenerateAccessToken.mockReturnValue('new-at');
      mockGenerateRefreshToken.mockReturnValue('new-rt');

      await refreshAccessToken(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should throw UnauthorizedError when refresh token is invalid', async () => {
      mockReq.body = { refreshToken: 'invalid-rt' };
      mockVerifyRefreshToken.mockResolvedValue(null);

      await expect(refreshAccessToken(mockReq as Request, mockRes as Response))
        .rejects.toThrow('Invalid or expired refresh token');
    });

    it('should return 500 on unexpected error', async () => {
      mockReq.body = { refreshToken: 'rt' };
      mockVerifyRefreshToken.mockRejectedValue(new Error('DB error'));

      await refreshAccessToken(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('logoutUser', () => {
    it('should logout user and return 200', async () => {
      mockReq.body = { refreshToken: 'valid-rt' };
      mockAuthService.logout.mockResolvedValue(undefined);

      await logoutUser(mockReq as Request, mockRes as Response);

      expect(mockAuthService.logout).toHaveBeenCalledWith('valid-rt');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should throw NotFoundError when token not found', async () => {
      mockReq.body = { refreshToken: 'bad-rt' };
      mockAuthService.logout.mockRejectedValue(new Error('TOKEN_NOT_FOUND'));

      await expect(logoutUser(mockReq as Request, mockRes as Response))
        .rejects.toThrow();
    });

    it('should return 500 on unexpected error', async () => {
      mockReq.body = { refreshToken: 'rt' };
      mockAuthService.logout.mockRejectedValue(new Error('DB error'));

      await logoutUser(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('logoutAllDevices', () => {
    it('should revoke all tokens and return 200', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockAuthService.revokeAllRefreshTokens.mockResolvedValue(undefined);

      await logoutAllDevices(mockReq as Request, mockRes as Response);

      expect(mockAuthService.revokeAllRefreshTokens).toHaveBeenCalledWith('u-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should throw UnauthorizedError when not authenticated', async () => {
      await expect(logoutAllDevices(mockReq as Request, mockRes as Response))
        .rejects.toThrow('Authentication required');
    });

    it('should return 500 on unexpected error', async () => {
      mockReq.user = { userId: 'u-1', email: 'test@test.com' };
      mockAuthService.revokeAllRefreshTokens.mockRejectedValue(new Error('DB error'));

      await logoutAllDevices(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
