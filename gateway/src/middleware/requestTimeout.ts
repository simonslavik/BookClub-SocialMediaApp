import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';
import { HTTP_STATUS, TIMEOUTS } from '../config/constants.js';

/**
 * Request timeout middleware
 * Configurable timeout with route-specific overrides
 * @param timeout - Default timeout in milliseconds
 */
export const requestTimeout = (timeout: number = TIMEOUTS.DEFAULT) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    let effectiveTimeout = timeout;

    // Longer timeout for file operations
    if (req.path.includes('/upload') || req.path.includes('/download')) {
      effectiveTimeout = TIMEOUTS.UPLOAD;
    }

    // Longer timeout for reports or heavy queries
    if (req.path.includes('/reports') || req.path.includes('/export')) {
      effectiveTimeout = TIMEOUTS.HEAVY;
    }

    const requestId = (req as any).id || 'unknown';

    // Set request timeout
    req.setTimeout(effectiveTimeout, () => {
      logger.error(
        `[${requestId}] Request timeout (${effectiveTimeout}ms) for ${req.method} ${req.url}`
      );

      if (!res.headersSent) {
        res.status(HTTP_STATUS.TIMEOUT).json({
          success: false,
          message: 'Request timeout',
          requestId,
          timeout: `${effectiveTimeout}ms`,
        });
      }
    });

    // Set response timeout
    res.setTimeout(effectiveTimeout, () => {
      logger.error(
        `[${requestId}] Response timeout (${effectiveTimeout}ms) for ${req.method} ${req.url}`
      );
    });

    next();
  };
};

export default requestTimeout;
