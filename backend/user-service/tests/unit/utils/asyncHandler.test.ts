import { jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../../src/utils/asyncHandler.js';

describe('asyncHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('should call the async function', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const handler = asyncHandler(fn);

    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(fn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
  });

  it('should catch errors and pass them to next()', async () => {
    const error = new Error('Test error');
    const fn = jest.fn().mockRejectedValue(error);
    const handler = asyncHandler(fn);

    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('should not call next on success', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const handler = asyncHandler(fn);

    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle sync errors thrown from the function', () => {
    const error = new Error('Sync error');
    const fn = jest.fn().mockImplementation(() => {
      throw error;
    });
    const handler = asyncHandler(fn);

    // asyncHandler uses Promise.resolve(fn(...)).catch(next)
    // A sync throw inside fn() propagates before Promise.resolve wraps it
    expect(() => handler(mockReq as Request, mockRes as Response, mockNext)).toThrow('Sync error');
  });
});
