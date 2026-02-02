import cors from 'cors';
import express, { Express } from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import logger from './utils/logger.js';
import { setupMiddleware } from './middleware/index.js';
import  {setupRoutes}  from './routes/index.js';
import { initializeRedis } from './config/redis.js';

// Load environment variables
dotenv.config();

// Constants
const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Initialize Express application
 */
const initializeApp = async (): Promise<Express> => {
  const app = express();

  // Security and parsing middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Initialize Redis connection
  const redisClient = await initializeRedis();

  // Setup custom middleware (auth, rate limiting, logging, etc.)
  setupMiddleware(app, redisClient);

  // Setup all routes and proxies
  setupRoutes(app, redisClient);

  return app;
};

/**
 * Start the server
 */
const startServer = async (): Promise<void> => {
  try {
    const app = await initializeApp();

    app.listen(PORT, () => {
      logger.info(`🚀 Gateway running on port ${PORT}`);
      logger.info(`📊 Environment: ${NODE_ENV}`);
      logger.info(`✅ Ready to accept requests`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();