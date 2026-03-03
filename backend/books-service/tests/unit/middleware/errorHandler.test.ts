import { Request, Response, NextFunction } from 'express';
import errorHandler from '../../../src/middleware/errorHandler';
import { AppError, NotFoundError, ValidationError, ForbiddenError, ConflictError } from '../../../src/utils/errors';
import { Prisma } from '@prisma/client';

jest.mock('../../../src/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('errorHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockNext = jest.fn();
    mockReq = { url: '/test', method: 'GET' };
    mockRes = { status: statusMock } as Partial<Response>;
  });

  describe('AppError handling', () => {
    it('should return 404 for NotFoundError', () => {
      const error = new NotFoundError('Book');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Book not found',
      });
    });

    it('should return 400 for ValidationError', () => {
      const error = new ValidationError('Invalid data');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid data',
      });
    });

    it('should return 403 for ForbiddenError', () => {
      const error = new ForbiddenError('Not allowed');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Not allowed',
      });
    });

    it('should return 409 for ConflictError', () => {
      const error = new ConflictError('Already exists');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Already exists',
      });
    });

    it('should return custom status for generic AppError', () => {
      const error = new AppError('Custom error', 422);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Custom error',
      });
    });

    it('should include NotFoundError id in message', () => {
      const error = new NotFoundError('Suggestion', 'abc-123');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: "Suggestion with id 'abc-123' not found",
      });
    });
  });

  describe('Prisma error handling', () => {
    it('should return 409 for P2002 (unique constraint)', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Resource already exists',
      });
    });

    it('should return 404 for P2025 (record not found)', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Resource not found',
      });
    });

    it('should return 500 for other Prisma error codes', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Other error', {
        code: 'P2003',
        clientVersion: '5.0.0',
      });

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Database operation failed',
      });
    });

    it('should return 400 for PrismaClientValidationError', () => {
      const error = new Prisma.PrismaClientValidationError('Validation failed', {
        clientVersion: '5.0.0',
      });

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid data provided',
      });
    });
  });

  describe('413 payload too large', () => {
    it('should handle entity too large by message', () => {
      const error = new Error('request entity too large');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(413);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Request body too large',
      });
    });

    it('should handle entity too large by type', () => {
      const error = new Error('payload too large') as any;
      error.type = 'entity.too.large';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(413);
    });
  });

  describe('Unknown errors', () => {
    it('should return 500 with generic message (never leaks error details)', () => {
      const error = new Error('Sensitive database connection string exposed');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
      });
    });
  });
});
