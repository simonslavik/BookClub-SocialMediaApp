import { jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';

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

  beforeEach(() => {
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
    it('should authenticate with x-user-id header', () => {
      mockReq.headers = { 'x-user-id': 'user-1', 'x-user-email': 'test@test.com' };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toEqual({
        userId: 'user-1',
        email: 'test@test.com',
      });
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

    it('should reject request without x-user-id header', () => {
      mockReq.headers = {};

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Authentication required' })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should default email to empty string when x-user-email is missing', () => {
      mockReq.headers = { 'x-user-id': 'user-1' };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user?.email).toBe('');
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should set user when x-user-id header is present', () => {
      mockReq.headers = { 'x-user-id': 'user-1', 'x-user-email': 'test@test.com' };

      optionalAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toEqual({
        userId: 'user-1',
        email: 'test@test.com',
      });
    });

    it('should continue without user when no x-user-id header', () => {
      mockReq.headers = {};

      optionalAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });
  });
});
