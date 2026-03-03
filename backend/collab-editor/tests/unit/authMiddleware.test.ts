import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, optionalAuthMiddleware } from '../../src/middleware/authMiddleware';

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

describe('authMiddleware', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  it('should return 401 if no authorization header', async () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'No authorization token provided' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 for invalid format (no Bearer)', async () => {
    const req = mockRequest({ authorization: 'Token abc123' }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Invalid authorization format') })
    );
  });

  it('should return 500 if JWT_SECRET is not set', async () => {
    delete process.env.JWT_SECRET;
    const token = jwt.sign({ userId: 'u1', email: 'a@b.com' }, 'some-secret');
    const req = mockRequest({ authorization: `Bearer ${token}` }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Server configuration error' })
    );
  });

  it('should attach user to request for valid token', async () => {
    const token = jwt.sign({ userId: 'user-123', email: 'test@example.com' }, JWT_SECRET, { expiresIn: '1h' });
    const req = mockRequest({ authorization: `Bearer ${token}` }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      userId: 'user-123',
      email: 'test@example.com',
    });
  });

  it('should return 401 for invalid token', async () => {
    const req = mockRequest({ authorization: 'Bearer invalid.token.here' }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid token' })
    );
  });

  it('should return 401 for expired token', async () => {
    const token = jwt.sign(
      { userId: 'user-123', email: 'test@example.com' },
      JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const req = mockRequest({ authorization: `Bearer ${token}` }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Token expired' })
    );
  });
});

describe('optionalAuthMiddleware', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  it('should call next without error when no token', async () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    await optionalAuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('should attach user for valid token', async () => {
    const token = jwt.sign({ userId: 'user-123', email: 'test@example.com' }, JWT_SECRET, { expiresIn: '1h' });
    const req = mockRequest({ authorization: `Bearer ${token}` }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    await optionalAuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      userId: 'user-123',
      email: 'test@example.com',
    });
  });

  it('should call next without error for invalid token', async () => {
    const req = mockRequest({ authorization: 'Bearer invalid.token' }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    await optionalAuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    // Should not set user, but should not error
  });

  it('should call next without error for invalid format', async () => {
    const req = mockRequest({ authorization: 'Basic abc123' }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    await optionalAuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
