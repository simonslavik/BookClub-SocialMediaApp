import { Express, Request, Response } from 'express';
import { RedisClientType } from 'redis';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { setupProxyRoutes } from './proxyRoutes.js';
import { HTTP_STATUS, AUTH_RATE_LIMIT } from '../config/constants.js';
import logger from '../utils/logger.js';

/**
 * Health check response interface
 */
interface HealthCheckResponse {
  status: 'healthy' | 'degraded';
  timestamp: string;
  uptime: number;
  service: string;
  dependencies: {
    redis: 'connected' | 'disconnected';
  };
}

/**
 * Health check endpoint
 */
const healthCheck = (redisClient: RedisClientType) => {
  return async (_req: Request, res: Response): Promise<void> => {
    const redisHealthy = redisClient.isReady;

    const response: HealthCheckResponse = {
      status: redisHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'api-gateway',
      dependencies: {
        redis: redisHealthy ? 'connected' : 'disconnected',
      },
    };

    const statusCode = redisHealthy ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;
    res.status(statusCode).json(response);
  };
};

/**
 * Create a stricter rate limiter for auth endpoints (login, register)
 */
const createAuthRateLimiter = (redisClient: RedisClientType) => {
  return rateLimit({
    windowMs: AUTH_RATE_LIMIT.WINDOW_MS,
    max: AUTH_RATE_LIMIT.MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => req.ip || 'unknown',
    handler: (_req: Request, res: Response) => {
      logger.warn('Auth rate limit exceeded');
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        message: 'Too many authentication attempts, please try again later',
      });
    },
    store: new RedisStore({
      prefix: 'rl:auth:',
      sendCommand: (...args: string[]) => redisClient.sendCommand(args) as any,
    }),
  });
};

/**
 * Setup all application routes
 * @param app - Express application instance
 * @param redisClient - Redis client for health checks
 */
export const setupRoutes = (app: Express, redisClient: RedisClientType): void => {
  // Health check endpoint (no rate limiting)
  app.get('/health', healthCheck(redisClient));

  // Auth rate limiter on login/register endpoints
  app.use('/v1/auth', createAuthRateLimiter(redisClient));

  // Microservice proxy routes
  setupProxyRoutes(app);

  // 404 catch-all for unmatched routes (must be last route)
  app.use((_req: Request, res: Response) => {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Route not found',
    });
  });
};

export default setupRoutes;
