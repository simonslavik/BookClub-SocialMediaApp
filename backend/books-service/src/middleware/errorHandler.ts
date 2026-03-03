import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Global error handler middleware
 * Handles custom AppErrors, Prisma errors, and unknown errors
 */
const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  // Custom application errors (NotFoundError, ValidationError, etc.)
  if (err instanceof AppError) {
    logger.warn(`${err.constructor.name}: ${err.message}`, {
      url: req.url,
      method: req.method,
      statusCode: err.statusCode,
    });

    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error(`Prisma error [${err.code}]: ${err.message}`, {
      url: req.url,
      method: req.method,
      code: err.code,
    });

    switch (err.code) {
      case 'P2002':
        res.status(409).json({
          success: false,
          error: 'Resource already exists',
        });
        return;
      case 'P2025':
        res.status(404).json({
          success: false,
          error: 'Resource not found',
        });
        return;
      default:
        res.status(500).json({
          success: false,
          error: 'Database operation failed',
        });
        return;
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.error(`Prisma validation error: ${err.message}`, {
      url: req.url,
      method: req.method,
    });

    res.status(400).json({
      success: false,
      error: 'Invalid data provided',
    });
    return;
  }

  // Payload too large (Express body-parser)
  if (err.message === 'request entity too large' || (err as any).type === 'entity.too.large') {
    res.status(413).json({
      success: false,
      error: 'Request body too large',
    });
    return;
  }

  // Unknown / unexpected errors — never leak internals
  logger.error(`Unhandled error: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
};

export default errorHandler;
