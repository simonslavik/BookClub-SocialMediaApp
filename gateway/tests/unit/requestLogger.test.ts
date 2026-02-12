import express, { Express, Response, NextFunction } from 'express';
import request from 'supertest';
import requestLogger from '../../src/middleware/requestLogger';

// Capture logger output
jest.mock('../../src/utils/logger', () => ({
  default: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  __esModule: true,
}));

import logger from '../../src/utils/logger';
const mockLogger = logger as jest.Mocked<typeof logger>;

const createApp = (): Express => {
  const app = express();
  app.use(express.json());

  // Attach fake request id
  app.use((req: any, _res: Response, next: NextFunction) => {
    req.id = 'req-123';
    next();
  });

  app.use(requestLogger);

  app.post('/test', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/test', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/error', (_req, res) => {
    res.status(500).json({ error: 'fail' });
  });

  return app;
};

describe('requestLogger middleware', () => {
  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  it('should log the request method and URL at info level', async () => {
    await request(app).get('/test').expect(200);

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('→ GET /test')
    );
  });

  it('should log request body at debug level (not info)', async () => {
    await request(app)
      .post('/test')
      .send({ name: 'Alice' })
      .expect(200);

    // Body should be logged at debug, not info
    expect(mockLogger.debug).toHaveBeenCalledWith(
      expect.stringContaining('Body:')
    );
  });

  it('should redact sensitive fields instead of deleting them', async () => {
    await request(app)
      .post('/test')
      .send({ username: 'alice', password: 'secret123', token: 'abc' })
      .expect(200);

    const debugCalls = mockLogger.debug.mock.calls
      .map(c => c[0])
      .filter((msg: string) => msg.includes('Body:'));

    expect(debugCalls.length).toBeGreaterThan(0);
    const bodyLog = debugCalls[0];
    expect(bodyLog).toContain('[REDACTED]');
    expect(bodyLog).not.toContain('secret123');
    expect(bodyLog).toContain('alice'); // non-sensitive field preserved
  });

  it('should not log body when body is empty', async () => {
    await request(app).get('/test').expect(200);

    const debugBodyCalls = mockLogger.debug.mock.calls
      .map(c => c[0])
      .filter((msg: string) => msg.includes('Body:'));

    expect(debugBodyCalls.length).toBe(0);
  });

  it('should log response completion with duration', async () => {
    await request(app).get('/test').expect(200);

    // Wait a tick for the 'finish' event to fire
    await new Promise(resolve => setTimeout(resolve, 50));

    const finishLogs = mockLogger.info.mock.calls
      .map(c => c[0])
      .filter((msg: string) => msg.includes('← 200'));

    expect(finishLogs.length).toBeGreaterThan(0);
    expect(finishLogs[0]).toMatch(/\d+ms/);
  });

  it('should log error responses at warn level', async () => {
    await request(app).get('/error').expect(500);

    await new Promise(resolve => setTimeout(resolve, 50));

    const warnCalls = mockLogger.warn.mock.calls
      .map(c => c[0])
      .filter((msg: string) => msg.includes('← 500'));

    expect(warnCalls.length).toBeGreaterThan(0);
  });
});
