import { jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Mock logger before importing auth middleware
jest.mock('../../../src/utils/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  logError: jest.fn(),
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { authMiddleware, optionalAuthMiddleware } from '../../../src/middleware/authMiddleware.js';

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  const JWT_SECRET = 'test-secret-key-for-testing';

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('authMiddleware', () => {
    it('should authenticate with valid Bearer token', async () => {
      const token = jwt.sign({ userId: 'user-1', email: 'test@test.com' }, JWT_SECRET);
      mockReq.headers = { authorization: `Bearer ${token}` };

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toEqual(expect.objectContaining({
        userId: 'user-1',
        email: 'test@test.com',
      }));
    });

    it('should authenticate with X-User-Id header (internal service call)', async () => {
      mockReq.headers = { 'x-user-id': 'internal-user-123' };

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toEqual({
        userId: 'internal-user-123',
        email: '',
      });
    });

    it('should reject request without authorization header', async () => {
      mockReq.headers = {};

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'No authorization token provided' })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid authorization format', async () => {
      mockReq.headers = { authorization: 'NotBearer token' };

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Invalid authorization format') })
      );
    });

    it('should reject expired token', async () => {
      const token = jwt.sign(
        { userId: 'user-1', email: 'test@test.com' },
        JWT_SECRET,
        { expiresIn: '0s' }
      );
      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      mockReq.headers = { authorization: `Bearer ${token}` };

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Token expired') })
      );
    });

    it('should reject invalid token', async () => {
      mockReq.headers = { authorization: 'Bearer invalid.token.here' };

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid token' })
      );
    });

    it('should reject token signed with wrong secret', async () => {
      const token = jwt.sign({ userId: 'user-1', email: 'test@test.com' }, 'wrong-secret');
      mockReq.headers = { authorization: `Bearer ${token}` };

      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid token' })
      );
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should set user from valid token', async () => {
      const token = jwt.sign({ userId: 'user-1', email: 'test@test.com' }, JWT_SECRET);
      mockReq.headers = { authorization: `Bearer ${token}` };

      await optionalAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toEqual(expect.objectContaining({
        userId: 'user-1',
        email: 'test@test.com',
      }));
    });

    it('should continue without user when no token', async () => {
      mockReq.headers = {};

      await optionalAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('should continue without user when invalid token', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };

      await optionalAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('should continue without user when invalid format', async () => {
      mockReq.headers = { authorization: 'NotBearer token' };

      await optionalAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });
  });
});
