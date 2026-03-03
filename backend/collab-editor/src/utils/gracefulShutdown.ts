import { Server } from 'http';
import { WebSocketServer } from 'ws';
import prisma from '../config/database.js';
import { logger } from './logger.js';

/**
 * Graceful shutdown handler
 * Closes all connections and cleans up resources
 */
export const setupGracefulShutdown = (server: Server, wss?: WebSocketServer) => {
  let isShuttingDown = false;

  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) {
      logger.warn('Shutdown already in progress, forcing exit...');
      process.exit(1);
    }

    isShuttingDown = true;
    logger.info(`${signal} received, starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');
    });

    try {
      // Close WebSocket connections
      if (wss) {
        logger.info('Closing WebSocket connections...');
        wss.clients.forEach((client) => {
          client.close(1000, 'Server shutting down');
        });
        wss.close(() => {
          logger.info('WebSocket server closed');
        });
      }

      // Close database connections
      logger.info('Closing database connections...');
      await prisma.$disconnect();
      logger.info('Database connections closed');

      logger.success('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', { error });
      process.exit(1);
    }
  };

  // Listen for termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error });
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
    gracefulShutdown('unhandledRejection');
  });
};
