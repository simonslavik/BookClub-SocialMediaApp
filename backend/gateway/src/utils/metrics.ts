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
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// HTTP request counter
export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Active connections gauge
export const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active HTTP connections',
  registers: [register],
});

// Proxy request duration (time spent in downstream services)
export const proxyRequestDuration = new client.Histogram({
  name: 'proxy_request_duration_seconds',
  help: 'Duration of proxied requests to downstream services',
  labelNames: ['target_service', 'method', 'status_code'],
  buckets: [0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// Rate-limited requests counter
export const rateLimitedRequests = new client.Counter({
  name: 'rate_limited_requests_total',
  help: 'Total number of rate-limited requests',
  registers: [register],
});

/**
 * Middleware to track HTTP request metrics
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip metrics endpoint itself
  if (req.path === '/metrics') {
    return next();
  }

  const start = Date.now();
  activeConnections.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
    activeConnections.dec();
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
