import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

/**
 * Optional authentication middleware
 * Extracts user ID from token if present, but doesn't reject if missing
 * Used for public endpoints that benefit from knowing who the user is
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided - continue without user
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      logger.debug('Token decoded in optionalAuth', { decoded, hasId: !!decoded.id, hasUserId: !!decoded.userId });
      
      // Support both 'id' and 'userId' fields in token
      const userId = decoded.userId || decoded.id;
      
      if (userId) {
        (req as any).user = { userId };
      } else {
        logger.warn('Token decoded but no userId/id found', { decoded });
      }
    } catch (error) {
      // Invalid token - continue without user (don't reject)
      logger.debug('Invalid token in optional auth', { error: error instanceof Error ? error.message : 'Unknown error' });
    }

    next();
  } catch (error) {
    // Error in middleware - continue without user
    logger.error('Error in optionalAuth middleware', { error: error instanceof Error ? error.message : 'Unknown error' });
    next();
  }
};
