import { Request, Response, NextFunction } from 'express';
import { optionalAuthMiddleware } from '../../src/middleware/authMiddleware';

const mockRequest = (headers: Record<string, string> = {}): Partial<Request> => ({
  headers,
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('optionalAuth middleware', () => {
  it('should call next without user when no auth headers', () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    optionalAuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeUndefined();
  });

  it('should call next without user when no x-user-id header', () => {
    const req = mockRequest({ 'x-user-email': 'test@example.com' }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    optionalAuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeUndefined();
  });

  it('should set user when x-user-id header is present', () => {
    const req = mockRequest({ 'x-user-id': 'user-123' }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    optionalAuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toEqual({
      userId: 'user-123',
      email: '',
      name: undefined,
    });
  });

  it('should set user with all headers when provided', () => {
    const req = mockRequest({
      'x-user-id': 'user-123',
      'x-user-email': 'test@example.com',
      'x-user-name': 'Test User',
    }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    optionalAuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toEqual({
      userId: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    });
  });

  it('should always call next regardless of headers', () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    optionalAuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
