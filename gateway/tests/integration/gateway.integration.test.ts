import express, { Express, Response, NextFunction } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import errorHandler from '../../src/middleware/errorHandler';
import requestId from '../../src/middleware/requestId';
import requestLogger from '../../src/middleware/requestLogger';
import authHandler, { optionalAuth } from '../../src/middleware/authHandler';
import { HTTP_STATUS } from '../../src/config/constants';

const JWT_SECRET = 'test-secret-key-for-testing';

/**
 * Build a minimal gateway-like app with the real middleware stack
 * (no Redis, no proxy — just testing middleware integration)
 */
const createGatewayApp = (): Express => {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Real middleware
  app.use(requestId);
  app.use(requestLogger);

  // Health check (public, no auth)
  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: 'api-gateway' });
  });

  // Public auth route
  app.post('/v1/auth/login', (_req, res) => {
    const { email, password } = _req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    const token = jwt.sign({ userId: 'user-1', email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, token });
  });

  // Optionally authenticated route
  app.get('/v1/books', optionalAuth, (req: any, res) => {
    res.json({
      books: [{ id: '1', title: 'Test Book' }],
      userId: req.user?.userId || null,
    });
  });

  // Protected route
  app.get('/v1/users/profile', authHandler, (req: any, res) => {
    res.json({
      userId: req.user.userId,
      email: req.user.email,
    });
  });

  // Protected route that throws
  app.get('/v1/users/error', authHandler, (_req, _res) => {
    throw new Error('Unexpected internal error');
  });

  // 404 catch-all
  app.use((_req: any, res: Response) => {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Route not found',
    });
  });

  // Error handler (after routes!)
  app.use(errorHandler);

  return app;
};

describe('Gateway Integration Tests', () => {
  let app: Express;
  let authToken: string;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    app = createGatewayApp();
    authToken = jwt.sign(
      { userId: 'test-user', email: 'test@example.com' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  // ─── Health Check ──────────────────────────────────────────

  describe('GET /health', () => {
    it('should return health status without auth', async () => {
      const res = await request(app).get('/health').expect(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('api-gateway');
    });

    it('should include x-request-id in response', async () => {
      const res = await request(app).get('/health').expect(200);
      expect(res.headers['x-request-id']).toBeDefined();
    });
  });

  // ─── Auth Routes ──────────────────────────────────────────

  describe('POST /v1/auth/login', () => {
    it('should return a token on successful login', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'alice@test.com', password: 'pass123' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();

      // Token should be verifiable
      const decoded = jwt.verify(res.body.token, JWT_SECRET) as any;
      expect(decoded.userId).toBe('user-1');
    });

    it('should return 400 when email is missing', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ password: 'pass123' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ─── Optional Auth ──────────────────────────────────────────

  describe('GET /v1/books (optionalAuth)', () => {
    it('should work without auth and return null userId', async () => {
      const res = await request(app).get('/v1/books').expect(200);
      expect(res.body.books).toHaveLength(1);
      expect(res.body.userId).toBeNull();
    });

    it('should attach user when valid auth is provided', async () => {
      const res = await request(app)
        .get('/v1/books')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.userId).toBe('test-user');
    });

    it('should still work with invalid token (optional)', async () => {
      const res = await request(app)
        .get('/v1/books')
        .set('Authorization', 'Bearer bad-token')
        .expect(200);

      expect(res.body.userId).toBeNull();
    });
  });

  // ─── Protected Routes ──────────────────────────────────────

  describe('GET /v1/users/profile (protected)', () => {
    it('should return user profile with valid token', async () => {
      const res = await request(app)
        .get('/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.userId).toBe('test-user');
      expect(res.body.email).toBe('test@example.com');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/v1/users/profile')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Authorization required');
    });

    it('should return 401 with expired token', async () => {
      const expired = jwt.sign(
        { userId: '1', email: 'x@x.com' },
        JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const res = await request(app)
        .get('/v1/users/profile')
        .set('Authorization', `Bearer ${expired}`)
        .expect(401);

      expect(res.body.message).toBe('Token expired');
    });

    it('should return 401 (not 403) with invalid token', async () => {
      const res = await request(app)
        .get('/v1/users/profile')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);

      expect(res.body.message).toBe('Invalid token');
    });
  });

  // ─── Error Handling ──────────────────────────────────────────

  describe('Error handling', () => {
    it('should return generic message for internal errors (no leak)', async () => {
      const res = await request(app)
        .get('/v1/users/error')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Internal server error');
      // Must NOT leak the actual error message
      expect(res.body.message).not.toContain('Unexpected internal error');
      expect(res.body.stack).toBeUndefined();
    });
  });

  // ─── 404 ──────────────────────────────────────────

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/unknown/path').expect(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Route not found');
    });

    it('should return 404 for wrong HTTP methods on existing routes', async () => {
      const res = await request(app).delete('/v1/auth/login').expect(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Request ID Propagation ──────────────────────────────────

  describe('Request ID propagation', () => {
    it('should generate and return x-request-id header', async () => {
      const res = await request(app).get('/health').expect(200);
      expect(res.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should echo back a client-provided request ID', async () => {
      const clientId = 'custom-trace-id-abc';
      const res = await request(app)
        .get('/health')
        .set('x-request-id', clientId)
        .expect(200);

      expect(res.headers['x-request-id']).toBe(clientId);
    });
  });
});
