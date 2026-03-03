import { Request, Response } from 'express';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Basic health check endpoint
 * Returns service status and timestamp
 * GET /health
 */
export const healthCheck = async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    const healthData = {
      status: 'healthy',
      service: 'user-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
    };

    return res.status(200).json(healthData);
  } catch (error) {
    logger.error('Health check failed:', error);
    return res.status(503).json({
      status: 'unhealthy',
      service: 'user-service',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Service unavailable',
    });
  }
};

/**
 * Readiness check endpoint for Kubernetes
 * Checks if service is ready to accept traffic
 * GET /health/ready
 */
export const readinessCheck = async (req: Request, res: Response) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: 'ready',
      checks: {
        database: 'ok',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    return res.status(503).json({
      status: 'not ready',
      checks: {
        database: 'failed',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Liveness check endpoint for Kubernetes
 * Checks if service process is alive and responding
 * GET /health/live
 */
export const livenessCheck = (req: Request, res: Response) => {
  // Simple check - if we can respond, we're alive
  return res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};
