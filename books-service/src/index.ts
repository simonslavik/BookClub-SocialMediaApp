import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import logger from './utils/logger';
import errorHandler from './middleware/errorHandler';
import { metricsMiddleware, metricsEndpoint } from './middleware/metrics';
import { connectRedis } from './config/redis';
import bookSearchRoutes from './routes/bookSearchRoutes';
import userBooksRoutes from './routes/userBooksRoutes';
import bookClubBooksRoutes from './routes/bookClubBooksRoutes';
import readingProgressRoutes from './routes/readingProgressRoutes';
import bookSuggestionsRoutes from './routes/bookSuggestionsRoutes';

const app: Express = express();
const PORT = process.env.PORT || 3002;

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Metrics middleware
app.use(metricsMiddleware);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'books-service',
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint for Prometheus
app.get('/metrics', metricsEndpoint);

// API Routes
app.use('/v1/books', bookSearchRoutes);
app.use('/v1/user-books', userBooksRoutes);
app.use('/v1/bookclub', bookClubBooksRoutes);
app.use('/v1/bookclub-books', readingProgressRoutes);
app.use('/v1/bookclub', bookSuggestionsRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize Redis connection
connectRedis().catch((error) => {
  logger.warn('Books service starting without Redis cache');
});

// Start server
app.listen(PORT, () => {
  logger.info(`📚 Books service running on http://localhost:${PORT}`);
});
