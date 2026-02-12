import { TIMEOUTS, RATE_LIMIT, AUTH_RATE_LIMIT, BODY_LIMITS, SENSITIVE_FIELDS, HTTP_STATUS } from '../../src/config/constants';

describe('constants', () => {
  describe('TIMEOUTS', () => {
    it('should have correct default timeout (10s)', () => {
      expect(TIMEOUTS.DEFAULT).toBe(10000);
    });

    it('should have correct upload timeout (60s)', () => {
      expect(TIMEOUTS.UPLOAD).toBe(60000);
    });

    it('should have correct heavy timeout (120s)', () => {
      expect(TIMEOUTS.HEAVY).toBe(120000);
    });
  });

  describe('RATE_LIMIT', () => {
    it('should have a 15-minute window', () => {
      expect(RATE_LIMIT.WINDOW_MS).toBe(15 * 60 * 1000);
    });

    it('should allow 1000 requests per window', () => {
      expect(RATE_LIMIT.MAX_REQUESTS).toBe(1000);
    });
  });

  describe('AUTH_RATE_LIMIT', () => {
    it('should be much stricter than the general rate limit', () => {
      expect(AUTH_RATE_LIMIT.MAX_REQUESTS).toBeLessThan(RATE_LIMIT.MAX_REQUESTS);
    });

    it('should allow at most 20 auth requests per window', () => {
      expect(AUTH_RATE_LIMIT.MAX_REQUESTS).toBe(20);
    });
  });

  describe('BODY_LIMITS', () => {
    it('should have sensible JSON limit (not 50mb)', () => {
      expect(BODY_LIMITS.JSON).toBe('2mb');
    });

    it('should have upload limit', () => {
      expect(BODY_LIMITS.UPLOAD).toBe('10mb');
    });
  });

  describe('SENSITIVE_FIELDS', () => {
    it('should include password', () => {
      expect(SENSITIVE_FIELDS).toContain('password');
    });

    it('should include token', () => {
      expect(SENSITIVE_FIELDS).toContain('token');
    });

    it('should include apiKey', () => {
      expect(SENSITIVE_FIELDS).toContain('apiKey');
    });
  });

  describe('HTTP_STATUS', () => {
    it('should have standard status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.CREATED).toBe(201);
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.FORBIDDEN).toBe(403);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.TOO_MANY_REQUESTS).toBe(429);
      expect(HTTP_STATUS.INTERNAL_ERROR).toBe(500);
    });

    it('should have gateway-specific status codes', () => {
      expect(HTTP_STATUS.PAYLOAD_TOO_LARGE).toBe(413);
      expect(HTTP_STATUS.BAD_GATEWAY).toBe(502);
      expect(HTTP_STATUS.SERVICE_UNAVAILABLE).toBe(503);
      expect(HTTP_STATUS.GATEWAY_TIMEOUT).toBe(504);
    });
  });
});
