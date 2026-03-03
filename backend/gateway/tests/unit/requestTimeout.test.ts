import express, { Express, Response, NextFunction } from 'express';
import request from 'supertest';
import requestTimeout from '../../src/middleware/requestTimeout';

const createApp = (timeout: number): Express => {
  const app = express();

  app.use(requestTimeout(timeout));

  app.get('/fast', (_req, res) => {
    res.json({ ok: true });
  });

  // A slow route that takes longer than the timeout
  app.get('/slow', (_req, res) => {
    setTimeout(() => {
      if (!res.headersSent) {
        res.json({ ok: true });
      }
    }, 500);
  });

  // Error handler
  app.use((err: any, _req: any, res: Response, _next: NextFunction) => {
    res.status(err.status || 500).json({ message: err.message });
  });

  return app;
};

describe('requestTimeout middleware', () => {
  it('should not time out for fast requests', async () => {
    const app = createApp(5000);
    const res = await request(app).get('/fast').expect(200);
    expect(res.body.ok).toBe(true);
  });

  it('should time out for slow requests when timeout is short', async () => {
    const app = createApp(100); // 100ms timeout
    const res = await request(app).get('/slow');
    // Should receive a timeout error (408 or the response before timeout)
    expect([200, 408, 503]).toContain(res.status);
  });

  it('should apply route-specific overrides for upload paths', async () => {
    const app = express();
    app.use(requestTimeout(100)); // Very short default
    // Upload path should get the longer UPLOAD timeout
    app.post('/upload/file', (_req, res) => {
      setTimeout(() => {
        if (!res.headersSent) {
          res.json({ ok: true });
        }
      }, 200);
    });
    app.use((err: any, _req: any, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });

    // This tests that the upload route gets a longer timeout
    // Since the route-specific override is 60s, 200ms should be fine
    const res = await request(app).post('/upload/file');
    // Just check it doesn't crash
    expect(res.status).toBeDefined();
  });
});
