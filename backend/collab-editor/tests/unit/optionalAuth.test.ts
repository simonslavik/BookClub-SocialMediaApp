import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { optionalAuth } from '../../src/middleware/optionalAuth';

const JWT_SECRET = 'test-secret-key-for-testing';

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
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  it('should call next without user when no auth header', () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeUndefined();
  });

  it('should call next without user when auth header is not Bearer', () => {
    const req = mockRequest({ authorization: 'Basic abc123' }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should set user.userId from token with userId field', () => {
    const token = jwt.sign({ userId: 'user-123' }, JWT_SECRET, { expiresIn: '1h' });
    const req = mockRequest({ authorization: `Bearer ${token}` }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toEqual({ userId: 'user-123' });
  });

  it('should set user.userId from token with id field (fallback)', () => {
    const token = jwt.sign({ id: 'user-456' }, JWT_SECRET, { expiresIn: '1h' });
    const req = mockRequest({ authorization: `Bearer ${token}` }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toEqual({ userId: 'user-456' });
  });

  it('should continue without error for expired token', () => {
    const token = jwt.sign({ userId: 'user-123' }, JWT_SECRET, { expiresIn: '-1s' });
    const req = mockRequest({ authorization: `Bearer ${token}` }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeUndefined();
  });

  it('should continue without error for invalid token', () => {
    const req = mockRequest({ authorization: 'Bearer garbage.token.here' }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeUndefined();
  });
});
