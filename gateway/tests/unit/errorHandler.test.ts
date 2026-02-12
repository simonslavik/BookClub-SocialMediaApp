import express, { Express, Request, Response, NextFunction } from 'express';
import request from 'supertest';
import errorHandler from '../../src/middleware/errorHandler';

const createApp = (): Express => {
  const app = express();
  app.use(express.json());

  // Attach a fake request id
  app.use((req: any, _res: Response, next: NextFunction) => {
    req.id = 'test-req-id';
    next();
  });

  // Route that throws generic error
  app.get('/throw', (_req: Request, _res: Response) => {
    throw new Error('Internal failure details');
  });

  // Route that throws error with status
  app.get('/bad-request', (_req: Request, _res: Response, next: NextFunction) => {
    const err: any = new Error('Validation failed');
    err.status = 400;
    err.expose = true;
    next(err);
  });

  // Route that simulates a proxy ECONNREFUSED
  app.get('/econnrefused', (_req: Request, _res: Response, next: NextFunction) => {
    const err: any = new Error('connect ECONNREFUSED 127.0.0.1:3001');
    err.code = 'ECONNREFUSED';
    next(err);
  });

  // Route that simulates a proxy ETIMEDOUT
  app.get('/etimedout', (_req: Request, _res: Response, next: NextFunction) => {
    const err: any = new Error('Timeout');
    err.code = 'ETIMEDOUT';
    next(err);
  });

  // Route that simulates ECONNRESET
  app.get('/econnreset', (_req: Request, _res: Response, next: NextFunction) => {
    const err: any = new Error('Connection reset');
    err.code = 'ECONNRESET';
    next(err);
  });

  // Route that simulates ENOTFOUND
  app.get('/enotfound', (_req: Request, _res: Response, next: NextFunction) => {
    const err: any = new Error('DNS not found');
    err.code = 'ENOTFOUND';
    next(err);
  });

  // Route that simulates entity.too.large
  app.get('/too-large', (_req: Request, _res: Response, next: NextFunction) => {
    const err: any = new Error('request entity too large');
    err.type = 'entity.too.large';
    next(err);
  });

  // Route that simulates entity.parse.failed
  app.get('/parse-failed', (_req: Request, _res: Response, next: NextFunction) => {
    const err: any = new Error('Unexpected token');
    err.type = 'entity.parse.failed';
    next(err);
  });

  // Route where headers are already sent
  app.get('/headers-sent', (req: Request, res: Response, next: NextFunction) => {
    res.write('partial');
    const err: any = new Error('After headers sent');
    next(err);
  });

  // Error handler under test
  app.use(errorHandler);

  return app;
};

describe('errorHandler', () => {
  let app: Express;

  beforeEach(() => {
    app = createApp();
  });

  it('should return 500 for generic errors and never leak the error message', async () => {
    const res = await request(app).get('/throw').expect(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Internal server error');
    // The actual error message must NOT appear in the response
    expect(res.body.message).not.toContain('Internal failure details');
    expect(res.body.requestId).toBe('test-req-id');
  });

  it('should include requestId in error response', async () => {
    const res = await request(app).get('/throw').expect(500);
    expect(res.body.requestId).toBe('test-req-id');
  });

  it('should use err.status for client errors with expose=true', async () => {
    const res = await request(app).get('/bad-request').expect(400);
    expect(res.body.message).toBe('Validation failed');
  });

  // --- Proxy / network errors ---

  it('should return 502 for ECONNREFUSED', async () => {
    const res = await request(app).get('/econnrefused').expect(502);
    expect(res.body.message).toBe('Service temporarily unavailable');
    expect(res.body.success).toBe(false);
  });

  it('should return 504 for ETIMEDOUT', async () => {
    const res = await request(app).get('/etimedout').expect(504);
    expect(res.body.message).toBe('Service request timed out');
  });

  it('should return 502 for ECONNRESET', async () => {
    const res = await request(app).get('/econnreset').expect(502);
    expect(res.body.message).toBe('Service connection lost');
  });

  it('should return 502 for ENOTFOUND', async () => {
    const res = await request(app).get('/enotfound').expect(502);
    expect(res.body.message).toBe('Service not reachable');
  });

  // --- Body-parser errors ---

  it('should return 413 for entity.too.large', async () => {
    const res = await request(app).get('/too-large').expect(413);
    expect(res.body.message).toBe('Request payload too large');
  });

  it('should return 400 for entity.parse.failed', async () => {
    const res = await request(app).get('/parse-failed').expect(400);
    expect(res.body.message).toBe('Malformed request body');
  });

  // --- Headers already sent ---

  it('should not crash when headers are already sent', () => {
    // Directly invoke the error handler with a mock response where headersSent=true
    const mockReq = { id: 'test-req-id', url: '/headers-sent', method: 'GET' } as any;
    const mockRes = {
      headersSent: true,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const mockNext = jest.fn();

    // Should not throw
    expect(() => {
      errorHandler(new Error('After headers sent'), mockReq, mockRes, mockNext);
    }).not.toThrow();

    // Should NOT try to send a response
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  // --- Never leak stack traces ---

  it('should never include stack traces in production or test', async () => {
    const res = await request(app).get('/throw').expect(500);
    expect(res.body.stack).toBeUndefined();
  });
});
