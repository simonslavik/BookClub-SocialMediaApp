import { jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';

// Mock logger
jest.mock('../../../src/utils/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  logError: jest.fn(),
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { validateRequest } from '../../../src/middleware/validateRequest.js';
import joi from 'joi';

describe('validateRequest Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  const schema = joi.object({
    name: joi.string().min(3).required(),
    email: joi.string().email().required(),
  });

  beforeEach(() => {
    mockReq = { body: {}, params: {}, query: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('should call next() for valid body data', () => {
    mockReq.body = { name: 'John', email: 'john@test.com' };

    validateRequest(schema)(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should strip unknown fields', () => {
    mockReq.body = { name: 'John', email: 'john@test.com', extra: 'removed' };

    validateRequest(schema)(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.body).not.toHaveProperty('extra');
  });

  it('should return 400 for invalid body data', () => {
    mockReq.body = { name: 'ab', email: 'not-email' };

    validateRequest(schema)(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Validation failed',
        errors: expect.any(Array),
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return all errors (abortEarly: false)', () => {
    mockReq.body = { name: 'ab', email: 'bad' };

    validateRequest(schema)(mockReq as Request, mockRes as Response, mockNext);

    const call = (mockRes.json as jest.Mock).mock.calls[0][0];
    expect(call.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('should validate params when source is params', () => {
    const paramSchema = joi.object({ id: joi.string().uuid().required() });
    mockReq.params = { id: '550e8400-e29b-41d4-a716-446655440000' };

    validateRequest(paramSchema, 'params')(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 400 for invalid params', () => {
    const paramSchema = joi.object({ id: joi.string().uuid().required() });
    mockReq.params = { id: 'not-a-uuid' };

    validateRequest(paramSchema, 'params')(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should validate query when source is query', () => {
    const querySchema = joi.object({ page: joi.number().min(1).default(1) });
    mockReq.query = { page: '5' } as any;

    validateRequest(querySchema, 'query')(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
