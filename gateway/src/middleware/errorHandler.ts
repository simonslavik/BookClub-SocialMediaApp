import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * Map of error codes to user-safe responses
 */
const PROXY_ERRORS: Record<string, { status: number; message: string }> = {
  ECONNREFUSED: { status: HTTP_STATUS.BAD_GATEWAY, message: 'Service temporarily unavailable' },
  ECONNRESET: { status: HTTP_STATUS.BAD_GATEWAY, message: 'Service connection lost' },
  ETIMEDOUT: { status: HTTP_STATUS.GATEWAY_TIMEOUT, message: 'Service request timed out' },
  ENOTFOUND: { status: HTTP_STATUS.BAD_GATEWAY, message: 'Service not reachable' },
};

/**
 * Global error handler middleware
 * Catches and formats all errors — never leaks internal details to clients
 */
const errorHandler = (
  err: any, 
  req: Request, 
  res: Response, 
  _next: NextFunction
): void => {
  const requestId = (req as any).id || 'unknown';
  
  // Log full error details server-side
  logger.error(`[${requestId}] Error: ${err.message}`, {
    stack: err.stack,
    code: err.code,
    url: req.url,
    method: req.method,
  });

  // Don't send response if headers already sent
  if (res.headersSent) {
    return;
  }

  // --- Proxy / network errors ---
  const proxyError = PROXY_ERRORS[err.code as string];
  if (proxyError) {
    res.status(proxyError.status).json({
      success: false,
      message: proxyError.message,
      requestId,
    });
    return;
  }

  // --- Body-parser errors ---
  if (err.type === 'entity.too.large') {
    res.status(HTTP_STATUS.PAYLOAD_TOO_LARGE).json({
      success: false,
      message: 'Request payload too large',
      requestId,
    });
    return;
  }

  if (err.type === 'entity.parse.failed') {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Malformed request body',
      requestId,
    });
    return;
  }

  // --- Generic errors — never send err.message to the client ---
  const statusCode = err.status || err.statusCode || HTTP_STATUS.INTERNAL_ERROR;

  // Use a safe, generic message for 5xx errors
  const safeMessage =
    statusCode < 500
      ? (err.expose ? err.message : 'Request error')
      : 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message: safeMessage,
    requestId,
  });
};

export default errorHandler;