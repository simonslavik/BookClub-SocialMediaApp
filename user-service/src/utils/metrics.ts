import client from 'prom-client';

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics for user-service

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

// Database query duration histogram
export const databaseQueryDuration = new client.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

// Authentication metrics
export const authenticationAttempts = new client.Counter({
  name: 'authentication_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['type', 'result'], // type: login/register, result: success/failure
  registers: [register],
});

// Active users gauge
export const activeUsers = new client.Gauge({
  name: 'active_users_total',
  help: 'Number of currently active/logged-in users',
  registers: [register],
});

// Friend request metrics
export const friendRequestsTotal = new client.Counter({
  name: 'friend_requests_total',
  help: 'Total number of friend requests',
  labelNames: ['action'], // action: sent/accepted/rejected
  registers: [register],
});

// Direct messages metrics
export const directMessagesTotal = new client.Counter({
  name: 'direct_messages_total',
  help: 'Total number of direct messages sent',
  registers: [register],
});

/**
 * Metrics endpoint handler
 * Returns Prometheus-formatted metrics
 */
export const getMetrics = async () => {
  return await register.metrics();
};

/**
 * Middleware to track HTTP metrics
 */
export const metricsMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();

  // Capture response
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    const statusCode = res.statusCode;

    // Record metrics
    httpRequestDuration.observe(
      { method, route, status_code: statusCode },
      duration
    );
    httpRequestTotal.inc({ method, route, status_code: statusCode });
  });

  next();
};

export default register;
