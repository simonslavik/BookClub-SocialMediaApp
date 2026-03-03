import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../src/middleware/authMiddleware';
import { requireBookClubRole } from '../../../src/middleware/bookclubRoleMiddleware';
import { ValidationError, ForbiddenError, NotFoundError } from '../../../src/utils/errors';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('../../../src/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('requireBookClubRole', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockNext = jest.fn();
    mockReq = {
      user: { userId: 'user-1', email: 'test@test.com', role: 'user' },
      params: { bookClubId: 'bc-1' },
      headers: { authorization: 'Bearer test-token' },
    };
    mockRes = {} as Partial<Response>;
    process.env.COLLAB_EDITOR_URL = 'http://collab-editor:4000';
    jest.clearAllMocks();
  });

  it('should call next(ValidationError) when user is not set', async () => {
    mockReq.user = undefined;

    await requireBookClubRole('MEMBER')(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
  });

  it('should call next(ValidationError) when bookClubId is missing', async () => {
    mockReq.params = {};

    await requireBookClubRole('MEMBER')(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
  });

  it('should call next() when user has sufficient role', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ role: 'ADMIN', status: 'ACTIVE' }),
    });

    await requireBookClubRole('MEMBER')(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockReq.bookClubRole).toBe('ADMIN');
  });

  it('should forward Authorization header in the request', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ role: 'MEMBER', status: 'ACTIVE' }),
    });

    await requireBookClubRole('MEMBER')(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    );
  });

  it('should call next(ForbiddenError) when role is insufficient', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ role: 'MEMBER', status: 'ACTIVE' }),
    });

    await requireBookClubRole('ADMIN')(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('should call next(ForbiddenError) when member is not active', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ role: 'ADMIN', status: 'BANNED' }),
    });

    await requireBookClubRole('MEMBER')(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('should call next(ForbiddenError) when collab-editor returns 403', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 403, statusText: 'Forbidden' });

    await requireBookClubRole('MEMBER')(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('should call next(NotFoundError) when collab-editor returns 404', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });

    await requireBookClubRole('MEMBER')(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  it('should call next(error) when collab-editor returns other errors', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });

    await requireBookClubRole('MEMBER')(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should respect role hierarchy (OWNER > ADMIN > MODERATOR > MEMBER)', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ role: 'OWNER', status: 'ACTIVE' }),
    });

    await requireBookClubRole('ADMIN')(mockReq as AuthRequest, mockRes as Response, mockNext);

    // OWNER (4) >= ADMIN (3) → should pass
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should default minRole to MEMBER', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ role: 'MEMBER', status: 'ACTIVE' }),
    });

    await requireBookClubRole()(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should use COLLAB_EDITOR_URL env variable', async () => {
    process.env.COLLAB_EDITOR_URL = 'http://custom-url:5000';
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ role: 'MEMBER', status: 'ACTIVE' }),
    });

    await requireBookClubRole()(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://custom-url:5000/bookclubs/bc-1/members/user-1/verify-role',
      expect.any(Object)
    );
  });
});
