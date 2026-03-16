import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import prisma from './config/database.js';
import notificationRoutes from './routes/notification.routes.js';
import { setupWebSocket } from './websocket/index.js';
import { startScheduler, stopScheduler } from './services/scheduler.service.js';
import { verifyEmailConnection } from './services/email.service.js';
import logger from './utils/logger.js';
import { metricsMiddleware, metricsEndpoint } from './utils/metrics.js';
import { requestLogger } from './middleware/requestLogger.js';

const app = express();
const PORT = process.env.PORT || 3005;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Security middleware
app.use(helmet());
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);
app.use(metricsMiddleware);

// HTTP server
const server = createServer(app);

// WebSocket for real-time notification delivery
setupWebSocket(server);

// Health check
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', service: 'notification-service', uptime: process.uptime() });
  } catch {
    res.status(503).json({ status: 'unhealthy' });
  }
});

// Prometheus metrics endpoint
app.get('/metrics', metricsEndpoint);

// Routes
app.use('/notifications', notificationRoutes);

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Start server
server.listen(PORT, () => {
  logger.info(`🔔 Notification service running on port ${PORT}`);

  // Start the reminder scheduler
  startScheduler();

  // Verify email connection (non-blocking)
  verifyEmailConnection().catch(() => {});
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received — shutting down...`);
  stopScheduler();
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
