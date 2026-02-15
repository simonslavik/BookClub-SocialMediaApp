import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import logger from './utils/logger';
import errorHandler from './middleware/errorHandler';
import { metricsMiddleware, metricsEndpoint } from './middleware/metrics';
import { connectRedis } from './config/redis';
import prisma from './config/database';
import bookSearchRoutes from './routes/bookSearchRoutes';
import userBooksRoutes from './routes/userBooksRoutes';
import bookClubBooksRoutes from './routes/bookClubBooksRoutes';
import readingProgressRoutes from './routes/readingProgressRoutes';
import bookSuggestionsRoutes from './routes/bookSuggestionsRoutes';

const app: Express = express();
const PORT = process.env.PORT || 3002;

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.GATEWAY_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Gateway-Source', 'X-Request-ID', 'X-Forwarded-For', 'X-User-Id', 'X-User-Email', 'X-User-Name'],
}));
app.use(express.json({ limit: '10kb' }));

// Metrics middleware
app.use(metricsMiddleware);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check with DB connectivity
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      service: 'books-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch {
    res.status(503).json({
      status: 'unhealthy',
      service: 'books-service',
      timestamp: new Date().toISOString(),
    });
  }
});

// Metrics endpoint for Prometheus (internal only)
app.get('/metrics', (req, res, next) => {
  // Block requests coming from browser origins (external)
  if (req.headers.origin) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}, metricsEndpoint);

// API Routes
app.use('/v1/books', bookSearchRoutes);
app.use('/v1/user-books', userBooksRoutes);
app.use('/v1/bookclub', bookClubBooksRoutes);
app.use('/v1/bookclub-books', readingProgressRoutes);
app.use('/v1/bookclub', bookSuggestionsRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize Redis connection
connectRedis().catch((_error) => {
  logger.warn('Books service starting without Redis cache');
});

// Start server
app.listen(PORT, () => {
  logger.info(`📚 Books service running on http://localhost:${PORT}`);
});
