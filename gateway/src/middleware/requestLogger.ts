import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';
import { SENSITIVE_FIELDS } from '../config/constants.js';

/**
 * Log incoming requests with sanitized body
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = (req as any).id || 'unknown';
  
  // Sanitize request body
  const sanitizedBody = { ...req.body };
  SENSITIVE_FIELDS.forEach(field => {
    delete sanitizedBody[field];
  });

  // Log request
  logger.info(`[${requestId}] ${req.method} ${req.url}`);
  
  // Log body if present
  if (Object.keys(sanitizedBody).length > 0) {
    logger.info(`[${requestId}] Body: ${JSON.stringify(sanitizedBody)}`);
  }

  next();
};

export default requestLogger;
