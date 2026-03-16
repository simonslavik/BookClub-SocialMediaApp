import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// ── Custom metrics ──────────────────────────────────

// HTTP request duration histogram
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// HTTP request counter
export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Notifications sent counter
export const notificationsSent = new client.Counter({
  name: 'notifications_sent_total',
  help: 'Total number of notifications sent',
  labelNames: ['type', 'channel'], // type: reminder/mention/invite, channel: push/email/ws
  registers: [register],
});

// WebSocket connections gauge
export const websocketConnections = new client.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

// Email delivery counter
export const emailDeliveryTotal = new client.Counter({
  name: 'email_delivery_total',
  help: 'Total number of emails sent',
  labelNames: ['status'], // success, failure
  registers: [register],
});

// Scheduler runs
export const schedulerRunsTotal = new client.Counter({
  name: 'scheduler_runs_total',
  help: 'Total number of scheduler job executions',
  labelNames: ['job', 'status'], // job: reminders/cleanup, status: success/failure
  registers: [register],
});

/**
 * Middleware to track HTTP request metrics
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/metrics') {
    return next();
  }

  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: String(res.statusCode) },
      duration,
    );
    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: String(res.statusCode),
    });
  });

  next();
};

/**
 * Metrics endpoint handler — returns Prometheus-formatted metrics
 */
export const metricsEndpoint = async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  const metrics = await register.metrics();
  res.end(metrics);
};

export { register };
