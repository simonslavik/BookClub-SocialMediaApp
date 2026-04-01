import { Request, Response, NextFunction } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../../src/middleware/authMiddleware';

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
  it('should return 401 if no x-user-id header', () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Authentication required' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when only email/name headers present without x-user-id', () => {
    const req = mockRequest({
      'x-user-email': 'test@example.com',
      'x-user-name': 'Test User',
    }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Authentication required' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach user to request when x-user-id is present', () => {
    const req = mockRequest({
      'x-user-id': 'user-123',
      'x-user-email': 'test@example.com',
      'x-user-name': 'Test User',
    }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      userId: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    });
  });

  it('should default email to empty string and name to undefined when not provided', () => {
    const req = mockRequest({ 'x-user-id': 'user-123' }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      userId: 'user-123',
      email: '',
      name: undefined,
    });
  });
});

describe('optionalAuthMiddleware', () => {
  it('should call next without error when no headers', () => {
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    optionalAuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('should attach user for valid headers', () => {
    const req = mockRequest({
      'x-user-id': 'user-123',
      'x-user-email': 'test@example.com',
    }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    optionalAuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      userId: 'user-123',
      email: 'test@example.com',
      name: undefined,
    });
  });

  it('should call next without setting user when no x-user-id', () => {
    const req = mockRequest({ 'x-user-email': 'test@example.com' }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    optionalAuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('should set all user fields when all headers provided', () => {
    const req = mockRequest({
      'x-user-id': 'user-123',
      'x-user-email': 'test@example.com',
      'x-user-name': 'Test User',
    }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    optionalAuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      userId: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    });
  });
});
