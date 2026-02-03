import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './config/database.js';
import { authMiddleware, optionalAuthMiddleware } from './middleware/authMiddleware.js';

// Routes
import bookClubRoutes from './routes/bookClubRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import inviteRoutes from './routes/inviteRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// WebSocket setup
import { setupWebSocket } from './websocket/index.js';
import { activeBookClubs } from './websocket/types.js';
// import { setActiveBookClubs } from './controllers/bookClubController.js'; // Removed: Not needed with new service

// New utilities
import { logger } from './utils/logger.js';
import { requestLogger } from './middleware/requestLogger.js';
import { metricsMiddleware, getMetrics } from './utils/metrics.js';
import { setupGracefulShutdown } from './utils/gracefulShutdown.js';
import { healthCheck, readinessCheck, livenessCheck } from './controllers/healthController.js';
import { AppError } from './utils/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware - order matters!
// CORS handled by gateway - no need for CORS here since all requests come through the gateway
app.use(express.json());
app.use(requestLogger); // HTTP request logging
app.use(metricsMiddleware); // Prometheus metrics
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// HTTP server
const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server });
setupWebSocket(wss);

// Share active bookclubs with controller
// setActiveBookClubs(activeBookClubs); // Removed: Not needed with new service

// Health and monitoring endpoints
app.get('/health', healthCheck);
app.get('/health/ready', readinessCheck);
app.get('/health/live', livenessCheck);
app.get('/metrics', getMetrics);

// Routes
app.use('/bookclubs', bookClubRoutes);
app.use('/bookclubs/:bookClubId/rooms', roomRoutes);
app.use('/bookclubs/:bookClubId/events', eventRoutes);
app.use('/invites', inviteRoutes);
app.use('/upload', uploadRoutes);

// Also mount event routes at top level for update/delete by eventId
import { updateEvent, deleteEvent } from './controllers/eventController.js';
app.patch('/events/:eventId', authMiddleware, updateEvent);
app.delete('/events/:eventId', authMiddleware, deleteEvent);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Handle custom AppError instances
  if (err instanceof AppError) {
    logger.error('Application Error', { 
      message: err.message, 
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });
    return res.status(err.statusCode).json({ 
      error: err.message,
      statusCode: err.statusCode,
    });
  }

  // Handle unknown errors
  logger.error('Unexpected Error', { 
    error: err,
    path: req.path,
    method: req.method,
  });
  
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    statusCode: err.status || 500,
  });
});

// Start server
server.listen(PORT, () => {
  logger.success(`BookClub Service running on port ${PORT}`);
  logger.info(`WebSocket server ready for connections`);
  logger.info(`Connected to database`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Metrics available at /metrics`);
});

// Setup graceful shutdown
setupGracefulShutdown(server, wss);
