import { createClient } from 'redis';
import logger from '../utils/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

let redisClient: ReturnType<typeof createClient> | null = null;

export const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            logger.error('Redis: Too many reconnection attempts, giving up');
            return new Error('Too many retries');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err: any) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('📦 Redis connected successfully');
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis client ready');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error: any) {
    logger.error('Failed to connect to Redis:', error.message);
    logger.warn('⚠️  Running without Redis cache - API calls will not be cached');
    return null;
  }
};

export const getRedisClient = () => {
  return redisClient;
};

export const closeRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
};
