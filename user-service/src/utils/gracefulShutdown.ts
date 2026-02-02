import { Server } from 'http';
import prisma from '../config/database.js';
import logger from './logger.js';

/**
 * Graceful shutdown handler
 * Ensures clean shutdown of server and database connections
 */
export const setupGracefulShutdown = (server: Server) => {
  // Shutdown handler
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed. No longer accepting connections.');

      try {
        // Close database connections
        await prisma.$disconnect();
        logger.info('Database connections closed.');

        logger.info('Graceful shutdown completed.');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forcefully shutting down after timeout');
      process.exit(1);
    }, 30000);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
  });

  logger.info('Graceful shutdown handlers registered');
};
