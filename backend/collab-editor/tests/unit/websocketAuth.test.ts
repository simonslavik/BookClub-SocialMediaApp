import jwt from 'jsonwebtoken';
import { verifyWebSocketToken } from '../../src/utils/websocketAuth';

describe('verifyWebSocketToken', () => {
  const JWT_SECRET = 'test-secret-key-for-testing';

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  it('should return invalid if no token provided', () => {
    const result = verifyWebSocketToken(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('No token provided');
  });

  it('should return invalid if JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET;
    const token = jwt.sign({ userId: 'u1', email: 'a@b.com' }, 'some-secret', { expiresIn: '1h' });
    const result = verifyWebSocketToken(token);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('JWT_SECRET not set');
  });

  it('should return valid for a good token', () => {
    const token = jwt.sign({ userId: 'user-123', email: 'test@example.com' }, JWT_SECRET, { expiresIn: '1h' });
    const result = verifyWebSocketToken(token);
    expect(result.valid).toBe(true);
    expect(result.userId).toBe('user-123');
    expect(result.email).toBe('test@example.com');
  });

  it('should return invalid for expired token', () => {
    const token = jwt.sign(
      { userId: 'user-123', email: 'test@example.com' },
      JWT_SECRET,
      { expiresIn: '-1s' } // already expired
    );
    const result = verifyWebSocketToken(token);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('expired');
  });

  it('should return invalid for wrong secret', () => {
    const token = jwt.sign({ userId: 'user-123', email: 'test@example.com' }, 'wrong-secret', { expiresIn: '1h' });
    const result = verifyWebSocketToken(token);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid token');
  });

  it('should return invalid for malformed token', () => {
    const result = verifyWebSocketToken('not.a.valid.jwt');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid token');
  });

  it('should return invalid if token missing userId', () => {
    const token = jwt.sign({ email: 'test@example.com' }, JWT_SECRET, { expiresIn: '1h' });
    const result = verifyWebSocketToken(token);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('missing required fields');
  });

  it('should return invalid if token missing email', () => {
    const token = jwt.sign({ userId: 'u1' }, JWT_SECRET, { expiresIn: '1h' });
    const result = verifyWebSocketToken(token);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('missing required fields');
  });
});
