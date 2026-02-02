import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { RedisClientType } from 'redis';
import { Request, Response } from 'express';
import logger from '../utils/logger.js';
import { RATE_LIMIT, HTTP_STATUS } from '../config/constants.js';

/**
 * Create rate limiter middleware with Redis store
 */
export const createRateLimiter = (redisClient: RedisClientType) => {
  return rateLimit({
    windowMs: RATE_LIMIT.WINDOW_MS,
    max: RATE_LIMIT.MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        message: 'Too many requests, please try again later',
      });
    },
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args) as any,
    }),
  });
};

export default createRateLimiter;
