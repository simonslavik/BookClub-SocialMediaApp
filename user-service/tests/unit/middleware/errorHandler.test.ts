import { jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';

// Mock logger
jest.mock('../../../src/utils/logger.js', () => {
  const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  return {
    __esModule: true,
    default: mockLogger,
    logger: mockLogger,
    logError: jest.fn(),
  };
});

import errorHandler from '../../../src/middleware/errorHandler.js';
import {
  AppError,
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ValidationError,
  InternalServerError,
  ConflictError,
} from '../../../src/utils/errors.js';

describe('Error Handler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    mockReq = { path: '/test', method: 'GET' };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('AppError handling', () => {
    it('should handle NotFoundError (404)', () => {
      const error = new NotFoundError('User not found');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User not found',
        })
      );
    });

    it('should handle BadRequestError (400)', () => {
      const error = new BadRequestError('Invalid input');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid input',
        })
      );
    });

    it('should handle UnauthorizedError (401)', () => {
      const error = new UnauthorizedError('Invalid token');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid token',
        })
      );
    });

    it('should handle ConflictError (409)', () => {
      const error = new ConflictError('Email already in use');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Email already in use',
        })
      );
    });

    it('should handle ValidationError with errors array', () => {
      const errors = [{ field: 'email', message: 'Invalid' }];
      const error = new ValidationError('Validation failed', errors);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Validation failed',
          errors,
        })
      );
    });

    it('should include stack in development mode', () => {
      process.env.NODE_ENV = 'development';
      const error = new BadRequestError('Test');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ stack: expect.any(String) })
      );
    });
  });

  describe('Prisma error handling', () => {
    it('should handle P2002 (unique constraint violation)', () => {
      const error = { code: 'P2002', message: 'Unique', meta: { target: ['email'] } };

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'A record with this value already exists',
        })
      );
    });

    it('should handle P2025 (record not found)', () => {
      const error = { code: 'P2025', message: 'Not found' };

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Record not found',
        })
      );
    });
  });

  describe('JWT error handling', () => {
    it('should handle JsonWebTokenError', () => {
      const error = { name: 'JsonWebTokenError', message: 'jwt malformed' };

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Invalid token' })
      );
    });

    it('should handle TokenExpiredError', () => {
      const error = { name: 'TokenExpiredError', message: 'jwt expired' };

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Token expired' })
      );
    });
  });

  describe('Validation error handling', () => {
    it('should handle errors with name ValidationError', () => {
      const error = { name: 'ValidationError', message: 'invalid', details: [{ message: 'bad field' }] };

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Validation failed',
        })
      );
    });
  });

  describe('Unknown error handling', () => {
    it('should default to 500 for unknown errors', () => {
      const error = new Error('Something unexpected');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it('should hide error message in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Sensitive details');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Internal server error',
        })
      );
    });

    it('should show error message in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Debug info');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Debug info',
        })
      );
    });
  });
});
