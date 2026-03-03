import logger from "../utils/logger.js";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log full error details
  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
    isOperational: err.isOperational || false,
    requestId: (req as any).id,
    path: req.path,
    method: req.method,
  });

  // Handle AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err instanceof Error && (err as any).errors && { errors: (err as any).errors }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists',
      ...(process.env.NODE_ENV === 'development' && { details: err.meta }),
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found',
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  // Handle Validation errors (Joi/Zod)
  if (err.name === 'ValidationError' || err.details) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      details: err.details || err.message,
    });
  }

  // Default to 500 for unexpected errors
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(500).json({
    success: false,
    message: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack }),
  });
};

export default errorHandler;