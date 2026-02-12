import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';
import { SENSITIVE_FIELDS } from '../config/constants.js';

/**
 * Log incoming requests with sanitized body
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = (req as any).id || 'unknown';
  const start = Date.now();

  // Log request line
  logger.info(`[${requestId}] → ${req.method} ${req.url}`);
  
  // Log body only at debug level and only if present (never log in prod unless debug enabled)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    SENSITIVE_FIELDS.forEach(field => {
      if (field in sanitizedBody) {
        sanitizedBody[field] = '[REDACTED]';
      }
    });
    logger.debug(`[${requestId}] Body: ${JSON.stringify(sanitizedBody)}`);
  }

  // Log response completion
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    logger[level](`[${requestId}] ← ${res.statusCode} ${req.method} ${req.url} (${duration}ms)`);
  });

  next();
};

export default requestLogger;
