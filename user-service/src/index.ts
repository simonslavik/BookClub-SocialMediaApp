// Core
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Third-party middleware
import cors from 'cors';
import helmet from 'helmet';

// Routes
import userRoutes from './routes/userRoutes.js';

// Middleware
import errorHandler from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { sanitizeInput } from './middleware/sanitizeInput.js';
import { requestIdMiddleware } from './middleware/requestId.js';

// Utils
import logger from './utils/logger.js';
import validateEnv from './utils/envValidator.js';

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Validate environment variables before starting
try {
    validateEnv();
} catch (error) {
    logger.error('Environment validation failed:', error);
    process.exit(1);
}

const app = express();

// ============================================================================
// Security Middleware
// ============================================================================

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false
}));

app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// ============================================================================
// Body Parsing Middleware
// ============================================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// Static Files
// ============================================================================

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================================================
// Request Processing Pipeline
// ============================================================================

app.use(requestIdMiddleware);  // Add unique ID for tracing
app.use(requestLogger);         // Log all requests
app.use(sanitizeInput);         // XSS protection

// ============================================================================
// Routes
// ============================================================================

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        service: 'user-service',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api', userRoutes);

// ============================================================================
// Error Handling (must be last)
// ============================================================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        message: 'Route not found',
        path: req.path 
    });
});

// Global error handler
app.use(errorHandler);

// ============================================================================
// Server Startup
// ============================================================================

app.listen(PORT, () => {
    logger.info(`🚀 User Service running on port ${PORT}`);
    logger.info(`📍 Health check: http://localhost:${PORT}/health`);
    logger.info(`🔐 API: http://localhost:${PORT}/api`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ============================================================================
// Process Error Handlers
// ============================================================================

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection:', { reason, promise });
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

export default app;
