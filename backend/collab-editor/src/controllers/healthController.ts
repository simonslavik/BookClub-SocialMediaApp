import { Request, Response } from 'express';
import prisma from '../config/database.js';

/**
 * Health check endpoint with comprehensive status
 */
export const healthCheck = async (req: Request, res: Response) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: 'unknown',
      memory: 'unknown',
    },
  };

  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.checks.database = 'healthy';
  } catch (error) {
    healthStatus.checks.database = 'unhealthy';
    healthStatus.status = 'degraded';
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const memoryUsageMB = {
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    external: Math.round(memoryUsage.external / 1024 / 1024),
  };

  // Flag if heap usage is over 80%
  if (memoryUsageMB.heapUsed / memoryUsageMB.heapTotal > 0.8) {
    healthStatus.checks.memory = 'warning';
    healthStatus.status = 'degraded';
  } else {
    healthStatus.checks.memory = 'healthy';
  }

  const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

  res.status(statusCode).json({
    ...healthStatus,
    memory: memoryUsageMB,
  });
};

/**
 * Readiness check - is the service ready to handle requests?
 */
export const readinessCheck = async (req: Request, res: Response) => {
  try {
    // Check if database is accessible
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, error: 'Database not ready' });
  }
};

/**
 * Liveness check - is the service alive?
 */
export const livenessCheck = (req: Request, res: Response) => {
  res.status(200).json({ alive: true });
};
