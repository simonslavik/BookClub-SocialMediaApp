import { createClient, RedisClientType } from 'redis';
import logger from '../utils/logger.js';

/**
 * Initialize and connect to Redis
 */
export const initializeRedis = async (): Promise<RedisClientType> => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  const client = createClient({ url: redisUrl }) as RedisClientType;

  try {
    await client.connect();
    logger.info(`✅ Redis connected: ${redisUrl}`);
    
    // Handle Redis errors
    client.on('error', (err: Error) => {
      logger.error('Redis client error:', err);
    });

    client.on('reconnecting', () => {
      logger.warn('Redis client reconnecting...');
    });

    return client;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};
