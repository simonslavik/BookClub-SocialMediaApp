import { jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';

// Mock logger and xss
jest.mock('../../../src/utils/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  logError: jest.fn(),
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { sanitizeInput } from '../../../src/middleware/sanitizeInput.js';

describe('Sanitize Input Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
      path: '/test',
      method: 'POST',
      ip: '127.0.0.1',
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  it('should pass through clean data unchanged', () => {
    mockReq.body = { name: 'John Doe', email: 'john@test.com' };

    sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.body).toEqual({ name: 'John Doe', email: 'john@test.com' });
    expect(mockNext).toHaveBeenCalled();
  });

  it('should strip script tags from body', () => {
    mockReq.body = { name: '<script>alert("xss")</script>John' };

    sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.body.name).not.toContain('<script>');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should sanitize nested objects', () => {
    mockReq.body = {
      user: {
        name: '<img src=x onerror=alert(1)>Test',
      },
    };

    sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.body.user.name).not.toContain('onerror');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should sanitize arrays', () => {
    mockReq.body = {
      items: ['<script>bad</script>clean'],
    };

    sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.body.items[0]).not.toContain('<script>');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should sanitize query params', () => {
    mockReq.query = { search: '<script>evil</script>hello' } as any;

    sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

    expect((mockReq.query as any).search).not.toContain('<script>');
  });

  it('should sanitize route params', () => {
    mockReq.params = { id: '<script>test</script>' };

    sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.params.id).not.toContain('<script>');
  });

  it('should handle empty body', () => {
    mockReq.body = {};

    sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should preserve non-string values', () => {
    mockReq.body = { count: 42, active: true, data: null };

    sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.body).toEqual({ count: 42, active: true, data: null });
  });
});
