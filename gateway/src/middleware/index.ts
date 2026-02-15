import { Express } from 'express';
import requestId from './requestId.js';
import requestTimeout from './requestTimeout.js';
import requestLogger from './requestLogger.js';
import createRateLimiter from './rateLimiter.js';
import stripInternalHeaders from './stripInternalHeaders.js';
import errorHandler from './errorHandler.js';
import { RedisClientType } from 'redis';
import { TIMEOUTS } from '../config/constants.js';

/**
 * Setup pre-route middleware (runs before routes)
 * @param app - Express application instance
 * @param redisClient - Redis client instance for rate limiting
 */
export const setupMiddleware = (app: Express, redisClient: RedisClientType): void => {
  // Strip internal headers to prevent client spoofing (MUST be first)
  app.use(stripInternalHeaders);

  // Request ID tracking
  app.use(requestId);

  // Request timeout
  app.use(requestTimeout(TIMEOUTS.DEFAULT));

  // Rate limiting (skip health checks)
  app.use(createRateLimiter(redisClient));

  // Request logging
  app.use(requestLogger);
};

/**
 * Setup post-route middleware (error handling — MUST be registered after routes)
 */
export const setupErrorHandling = (app: Express): void => {
  app.use(errorHandler);
};

export default setupMiddleware;
