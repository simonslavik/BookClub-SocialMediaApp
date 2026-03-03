import express, { Express } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import authHandler, { optionalAuth } from '../../src/middleware/authHandler';

const JWT_SECRET = 'test-secret-key-for-testing';

const createApp = (middleware: any): Express => {
  const app = express();
  app.use(express.json());
  app.use(middleware);
  app.get('/test', (req: any, res) => {
    res.json({
      user: req.user || null,
      userId: req.headers['x-user-id'] || null,
      userEmail: req.headers['x-user-email'] || null,
    });
  });
  return app;
};

describe('authHandler', () => {
  let app: Express;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  beforeEach(() => {
    app = createApp(authHandler);
  });

  it('should return 401 when no Authorization header is provided', async () => {
    const res = await request(app).get('/test').expect(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Authorization required');
  });

  it('should return 401 when token is missing from Bearer header', async () => {
    const res = await request(app)
      .get('/test')
      .set('Authorization', 'Bearer ')
      .expect(401);
    // 'Bearer ' splits to ['Bearer', ''], empty string is falsy → 'Authorization required'
    expect(res.body.message).toBe('Authorization required');
  });

  it('should return 401 (not 403) for an invalid token', async () => {
    const res = await request(app)
      .get('/test')
      .set('Authorization', 'Bearer invalid.token.here')
      .expect(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid token');
  });

  it('should return 401 for an expired token', async () => {
    const token = jwt.sign(
      { userId: '123', email: 'test@test.com' },
      JWT_SECRET,
      { expiresIn: '-1h' }
    );
    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
    expect(res.body.message).toBe('Token expired');
  });

  it('should return 401 for a token signed with wrong secret', async () => {
    const token = jwt.sign({ userId: '123', email: 'a@b.com' }, 'wrong-secret');
    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
    expect(res.body.message).toBe('Invalid token');
  });

  it('should authenticate and attach user to request for a valid token', async () => {
    const token = jwt.sign(
      { userId: 'user-42', email: 'alice@example.com' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.user.userId).toBe('user-42');
    expect(res.body.user.email).toBe('alice@example.com');
  });

  it('should forward x-user-id and x-user-email headers', async () => {
    const token = jwt.sign(
      { userId: 'user-99', email: 'bob@example.com' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.userId).toBe('user-99');
    expect(res.body.userEmail).toBe('bob@example.com');
  });

  it('should return 500 when JWT_SECRET is not set', async () => {
    const originalSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    const token = jwt.sign({ userId: '1', email: 'x@x.com' }, 'any-secret');
    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`)
      .expect(500);

    expect(res.body.message).toBe('Server configuration error');
    process.env.JWT_SECRET = originalSecret;
  });
});

describe('optionalAuth', () => {
  let app: Express;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  beforeEach(() => {
    app = createApp(optionalAuth);
  });

  it('should continue without error when no token is provided', async () => {
    const res = await request(app).get('/test').expect(200);
    expect(res.body.user).toBeNull();
  });

  it('should attach user when a valid token is provided', async () => {
    const token = jwt.sign(
      { userId: 'opt-1', email: 'opt@test.com' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.user.userId).toBe('opt-1');
  });

  it('should continue without user when token is invalid', async () => {
    const res = await request(app)
      .get('/test')
      .set('Authorization', 'Bearer garbage-token')
      .expect(200);

    expect(res.body.user).toBeNull();
  });

  it('should continue without user when token is expired', async () => {
    const token = jwt.sign(
      { userId: '1', email: 'x@x.com' },
      JWT_SECRET,
      { expiresIn: '-1h' }
    );

    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.user).toBeNull();
  });

  it('should continue without user when JWT_SECRET is missing', async () => {
    const original = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    const token = jwt.sign({ userId: '1', email: 'x@x.com' }, 'any');
    const res = await request(app)
      .get('/test')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.user).toBeNull();
    process.env.JWT_SECRET = original;
  });
});
