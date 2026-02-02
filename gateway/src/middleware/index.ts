import { Express } from 'express';
import requestId from './requestId.js';
import requestTimeout from './requestTimeout.js';
import requestLogger from './requestLogger.js';
import createRateLimiter from './rateLimiter.js';
import errorHandler from './errorHandler.js';
import { RedisClientType } from 'redis';
import { TIMEOUTS } from '../config/constants.js';

/**
 * Setup all middleware for the application
 * @param app - Express application instance
 * @param redisClient - Redis client instance for rate limiting
 */
export const setupMiddleware = (app: Express, redisClient: RedisClientType): void => {
  // Request ID tracking
  app.use(requestId);

  // Request timeout
  app.use(requestTimeout(TIMEOUTS.DEFAULT));

  // Rate limiting
  app.use(createRateLimiter(redisClient));

  // Request logging
  app.use(requestLogger);

  // Error handler (must be last)
  app.use(errorHandler);
};

export default setupMiddleware;
