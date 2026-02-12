import express, { Express, Request, Response, NextFunction } from 'express';
import request from 'supertest';
import requestId from '../../src/middleware/requestId';

const createApp = (): Express => {
  const app = express();
  app.use(requestId);
  app.get('/test', (req: any, res: Response) => {
    res.json({
      id: req.id,
      headerSent: res.getHeader('x-request-id'),
    });
  });
  return app;
};

describe('requestId middleware', () => {
  let app: Express;

  beforeEach(() => {
    app = createApp();
  });

  it('should generate a UUID when no x-request-id header is present', async () => {
    const res = await request(app).get('/test').expect(200);
    expect(res.body.id).toBeDefined();
    // UUID v4 format
    expect(res.body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('should set x-request-id response header', async () => {
    const res = await request(app).get('/test').expect(200);
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.headers['x-request-id']).toBe(res.body.id);
  });

  it('should reuse incoming x-request-id header', async () => {
    const incomingId = 'my-custom-request-id-123';
    const res = await request(app)
      .get('/test')
      .set('x-request-id', incomingId)
      .expect(200);

    expect(res.body.id).toBe(incomingId);
    expect(res.headers['x-request-id']).toBe(incomingId);
  });

  it('should generate unique IDs for different requests', async () => {
    const res1 = await request(app).get('/test').expect(200);
    const res2 = await request(app).get('/test').expect(200);
    expect(res1.body.id).not.toBe(res2.body.id);
  });
});
