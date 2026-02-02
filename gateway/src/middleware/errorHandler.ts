import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * Global error handler middleware
 * Catches and formats all errors
 */
const errorHandler = (
  err: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  const requestId = (req as any).id || 'unknown';
  
  // Log error with request context
  logger.error(`[${requestId}] Error: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Don't send response if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || err.statusCode || HTTP_STATUS.INTERNAL_ERROR;
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    requestId,
    ...((!isProduction && err.stack) && { stack: err.stack }),
  });
};

export default errorHandler;