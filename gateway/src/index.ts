import compression from 'compression';
import cors from 'cors';
import express, { Express } from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import http from 'http';
import logger from './utils/logger.js';
import { setupMiddleware, setupErrorHandling } from './middleware/index.js';
import { setupRoutes } from './routes/index.js';
import { initializeRedis } from './config/redis.js';
import { BODY_LIMITS } from './config/constants.js';

// Load environment variables
dotenv.config();

// Constants
const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Initialize Express application
 */
let redisClient: Awaited<ReturnType<typeof initializeRedis>> | null = null;

const initializeApp = async (): Promise<Express> => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // Compress all responses (gzip/brotli)
  app.use(compression());
  
  // CORS configuration
  app.use(cors({
    origin: [FRONTEND_URL, 'http://localhost:5174', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  
  // Body parsing with sensible limits (uploads are handled by downstream services)
  app.use(express.json({ limit: BODY_LIMITS.JSON }));
  app.use(express.urlencoded({ limit: BODY_LIMITS.URL_ENCODED, extended: true }));

  // Initialize Redis connection
  redisClient = await initializeRedis();

  // Pre-route middleware (request ID, timeout, rate limiting, logging)
  setupMiddleware(app, redisClient);

  // Routes and proxies
  setupRoutes(app, redisClient);

  // Error handler MUST be registered AFTER routes
  setupErrorHandling(app);

  return app;
};

/**
 * Start the server
 */
let server: http.Server;

const startServer = async (): Promise<void> => {
  try {
    const app = await initializeApp();

    server = app.listen(PORT, () => {
      logger.info(`🚀 Gateway running on port ${PORT}`);
      logger.info(`📊 Environment: ${NODE_ENV}`);
      logger.info(`✅ Ready to accept requests`);
    });

    // Set server-level timeout (slightly above the longest route timeout)
    server.keepAliveTimeout = 130_000;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Graceful shutdown — close server, drain connections, then exit
 */
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);

  // Close Redis connection
  if (redisClient) {
    try {
      await redisClient.disconnect();
      logger.info('Redis connection closed');
    } catch (err) {
      logger.error('Error closing Redis:', err);
    }
  }

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force exit if shutdown takes too long
    setTimeout(() => {
      logger.error('Forced shutdown — connections did not drain in time');
      process.exit(1);
    }, 10_000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch fatal errors so the process doesn't die silently
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Start the server
startServer();