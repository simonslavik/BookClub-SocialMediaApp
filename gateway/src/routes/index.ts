import { Express, Request, Response } from 'express';
import { RedisClientType } from 'redis';
import { setupProxyRoutes } from './proxyRoutes.js';
import { HTTP_STATUS } from '../config/constants.js';

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
  return async (req: Request, res: Response): Promise<void> => {
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
 * Setup all application routes
 * @param app - Express application instance
 * @param redisClient - Redis client for health checks
 */
export const setupRoutes = (app: Express, redisClient: RedisClientType): void => {
  // Health check endpoint
  app.get('/health', healthCheck(redisClient));

  // Microservice proxy routes
  setupProxyRoutes(app);
};

export default setupRoutes;
