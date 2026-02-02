import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Production format: JSON for machine parsing
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Development format: Pretty, colorized output
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
  })
);

const isProduction = process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: isProduction ? productionFormat : developmentFormat,
  defaultMeta: { service: 'user-service' },
  transports: [
    // Error logs - always write to file
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: productionFormat, // Always JSON for files
    }),
    // All logs - always write to file
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: productionFormat, // Always JSON for files
    }),
  ],
});

// Console output: pretty in dev, JSON in production
logger.add(new winston.transports.Console({
  format: isProduction ? productionFormat : developmentFormat
}));

// Helper methods for common logging patterns
export const logError = (error: any, message?: string, context?: Record<string, any>) => {
  logger.error({
    message: message || error.message,
    stack: error.stack,
    ...context,
  });
};

export const logRequest = (req: any) => {
  logger.info({
    type: 'REQUEST',
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.userId,
  });
};

export { logger };
export default logger;