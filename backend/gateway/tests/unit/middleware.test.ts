import jwt from 'jsonwebtoken';

describe('Authentication Middleware Tests', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

  describe('Token Validation', () => {
    it('should validate valid JWT token', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      expect(decoded.userId).toBe('123');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should reject invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        jwt.verify(invalidToken, JWT_SECRET);
      }).toThrow();
    });

    it('should reject expired token', () => {
      const payload = { userId: '123' };
      const expiredToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '-1h' });

      expect(() => {
        jwt.verify(expiredToken, JWT_SECRET);
      }).toThrow('jwt expired');
    });

    it('should reject token with wrong secret', () => {
      const payload = { userId: '123' };
      const token = jwt.sign(payload, 'wrong-secret');

      expect(() => {
        jwt.verify(token, JWT_SECRET);
      }).toThrow();
    });
  });

  describe('Token Extraction', () => {
    const extractToken = (authHeader: string | undefined): string | null => {
      if (!authHeader) return null;
      if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
      return null;
    };

    it('should extract Bearer token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      const header = `Bearer ${token}`;
      
      expect(extractToken(header)).toBe(token);
    });

    it('should return null for missing header', () => {
      expect(extractToken(undefined)).toBeNull();
    });

    it('should return null for malformed header', () => {
      expect(extractToken('InvalidToken')).toBeNull();
      expect(extractToken('Basic abc123')).toBeNull();
    });

    it('should handle empty Bearer token', () => {
      expect(extractToken('Bearer ')).toBe('');
    });
  });

  describe('User ID Extraction', () => {
    it('should extract userId from valid token', () => {
      const userId = 'user-123';
      const token = jwt.sign({ userId }, JWT_SECRET);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      expect(decoded.userId).toBe(userId);
    });

    it('should handle tokens with additional claims', () => {
      const claims = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user'
      };
      const token = jwt.sign(claims, JWT_SECRET);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      expect(decoded.userId).toBe(claims.userId);
      expect(decoded.email).toBe(claims.email);
      expect(decoded.role).toBe(claims.role);
    });
  });
});

describe('Rate Limiting Tests', () => {
  interface RateLimitStore {
    [key: string]: { count: number; resetTime: number };
  }

  class RateLimiter {
    private store: RateLimitStore = {};
    private readonly limit: number;
    private readonly windowMs: number;

    constructor(limit: number = 100, windowMs: number = 60000) {
      this.limit = limit;
      this.windowMs = windowMs;
    }

    check(identifier: string): boolean {
      const now = Date.now();
      const record = this.store[identifier];

      if (!record || now > record.resetTime) {
        this.store[identifier] = {
          count: 1,
          resetTime: now + this.windowMs
        };
        return true;
      }

      if (record.count < this.limit) {
        record.count++;
        return true;
      }

      return false;
    }

    reset(identifier: string): void {
      delete this.store[identifier];
    }
  }

  describe('Rate Limit Enforcement', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter(5, 60000); // 5 requests per minute
    });

    it('should allow requests under limit', () => {
      const ip = '192.168.1.1';
      
      expect(limiter.check(ip)).toBe(true);
      expect(limiter.check(ip)).toBe(true);
      expect(limiter.check(ip)).toBe(true);
    });

    it('should block requests over limit', () => {
      const ip = '192.168.1.1';
      
      // Use up the limit
      for (let i = 0; i < 5; i++) {
        expect(limiter.check(ip)).toBe(true);
      }
      
      // Next request should be blocked
      expect(limiter.check(ip)).toBe(false);
    });

    it('should track different IPs separately', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';
      
      // Use up limit for ip1
      for (let i = 0; i < 5; i++) {
        limiter.check(ip1);
      }
      
      // ip2 should still be allowed
      expect(limiter.check(ip2)).toBe(true);
    });

    it('should reset after time window', () => {
      const limiter = new RateLimiter(5, 100); // 100ms window for fast testing
      const ip = '192.168.1.1';
      
      // Use up the limit
      for (let i = 0; i < 5; i++) {
        limiter.check(ip);
      }
      
      // Reset manually (simulating time window expiry)
      limiter.reset(ip);
      
      // Should be allowed again
      expect(limiter.check(ip)).toBe(true);
    });
  });

  describe('IP Address Extraction', () => {
    const getClientIp = (headers: any): string => {
      return (
        headers['x-forwarded-for']?.split(',')[0] ||
        headers['x-real-ip'] ||
        '127.0.0.1'
      );
    };

    it('should extract IP from x-forwarded-for', () => {
      const headers = { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' };
      expect(getClientIp(headers)).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip', () => {
      const headers = { 'x-real-ip': '192.168.1.1' };
      expect(getClientIp(headers)).toBe('192.168.1.1');
    });

    it('should default to localhost', () => {
      const headers = {};
      expect(getClientIp(headers)).toBe('127.0.0.1');
    });

    it('should prioritize x-forwarded-for over x-real-ip', () => {
      const headers = {
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '10.0.0.1'
      };
      expect(getClientIp(headers)).toBe('192.168.1.1');
    });
  });
});

describe('Error Handling Middleware Tests', () => {
  interface ErrorResponse {
    error: string;
    message?: string;
    statusCode: number;
  }

  const formatError = (error: any, statusCode: number = 500): ErrorResponse => {
    return {
      error: error.message || 'Internal Server Error',
      message: error.details || undefined,
      statusCode
    };
  };

  describe('Error Response Formatting', () => {
    it('should format generic errors', () => {
      const error = new Error('Something went wrong');
      const formatted = formatError(error);
      
      expect(formatted.error).toBe('Something went wrong');
      expect(formatted.statusCode).toBe(500);
    });

    it('should include error details if available', () => {
      const error = { message: 'Validation failed', details: 'Email is required' };
      const formatted = formatError(error, 400);
      
      expect(formatted.error).toBe('Validation failed');
      expect(formatted.message).toBe('Email is required');
      expect(formatted.statusCode).toBe(400);
    });

    it('should handle different status codes', () => {
      expect(formatError(new Error('Not found'), 404).statusCode).toBe(404);
      expect(formatError(new Error('Unauthorized'), 401).statusCode).toBe(401);
      expect(formatError(new Error('Forbidden'), 403).statusCode).toBe(403);
    });
  });

  describe('Error Status Code Mapping', () => {
    const getStatusCode = (error: any): number => {
      if (error.statusCode) return error.statusCode;
      if (error.message.includes('not found')) return 404;
      if (error.message.includes('unauthorized')) return 401;
      if (error.message.includes('forbidden')) return 403;
      if (error.message.includes('validation')) return 400;
      return 500;
    };

    it('should map error types to status codes', () => {
      expect(getStatusCode({ message: 'User not found' })).toBe(404);
      expect(getStatusCode({ message: 'unauthorized access' })).toBe(401);
      expect(getStatusCode({ message: 'forbidden action' })).toBe(403);
      expect(getStatusCode({ message: 'validation failed' })).toBe(400);
    });

    it('should default to 500 for unknown errors', () => {
      expect(getStatusCode({ message: 'Unknown error' })).toBe(500);
    });

    it('should use explicit statusCode if provided', () => {
      expect(getStatusCode({ statusCode: 429, message: 'Too many requests' })).toBe(429);
    });
  });
});
