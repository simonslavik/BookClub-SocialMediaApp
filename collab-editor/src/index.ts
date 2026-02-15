import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './config/database.js';
import { authMiddleware } from './middleware/authMiddleware.js';

// Routes
import bookClubRoutes from './routes/bookClubRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import inviteRoutes from './routes/inviteRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import messageModerationRoutes from './routes/messageModerationRoutes.js';

// WebSocket setup
import { setupWebSocket } from './websocket/index.js';

// Utilities
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
// CORS configuration for direct file access from frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger); // HTTP request logging
app.use(metricsMiddleware); // Prometheus metrics
app.use(express.static(path.join(__dirname, '../public')));
// Serve uploaded files WITHOUT auth — files use random UUIDs as filenames (unguessable).
// Browser <img src="..."> and fetch() requests don't carry x-user-id headers,
// so authMiddleware would reject them with 401.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// HTTP server
const server = createServer(app);

// WebSocket server (64KB max payload to prevent memory abuse)
const wss = new WebSocketServer({ server, maxPayload: 64 * 1024 });
setupWebSocket(wss);

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
app.use('/moderation', messageModerationRoutes);

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
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  
  res.status(err.status || 500).json({ 
    error: 'Internal server error',
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
