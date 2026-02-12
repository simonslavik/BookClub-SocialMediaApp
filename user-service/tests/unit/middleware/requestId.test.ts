import { jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'generated-uuid-1234'),
}));

import { requestIdMiddleware } from '../../../src/middleware/requestId.js';

describe('Request ID Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {
      setHeader: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should generate a new request ID if not provided', () => {
    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect((mockReq as any).id).toBe('generated-uuid-1234');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', 'generated-uuid-1234');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should use existing X-Request-ID from header', () => {
    mockReq.headers = { 'x-request-id': 'client-provided-id' };

    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect((mockReq as any).id).toBe('client-provided-id');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', 'client-provided-id');
    expect(mockNext).toHaveBeenCalled();
  });
});
