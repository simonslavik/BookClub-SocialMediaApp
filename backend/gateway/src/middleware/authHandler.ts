import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * JWT payload interface
 */
export interface JwtPayload {
  userId: string;
  email: string;
  name?: string;
  iat: number;
  exp: number;
}

/**
 * Extend Express Request type
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Authentication middleware
 * Validates JWT tokens and attaches user info to request
 */
const authHandler = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: 'Authorization required',
      success: false,
    });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    logger.error('JWT_SECRET is not defined in environment variables');
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      message: 'Server configuration error',
      success: false,
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    req.user = decoded;

    // Add user info to headers for microservices
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-user-email'] = decoded.email;
    if (decoded.name) {
      req.headers['x-user-name'] = decoded.name.replace(/[\r\n]/g, '');
    }

    logger.debug(`Auth: user ${decoded.userId} → ${req.method} ${req.path}`);
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      logger.debug(`Expired token for ${req.method} ${req.path}`);
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Token expired',
        success: false,
      });
      return;
    }

    if (err instanceof jwt.JsonWebTokenError) {
      logger.debug(`Invalid token for ${req.method} ${req.path}`);
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Invalid token',
        success: false,
      });
      return;
    }

    logger.error(`Token verification error: ${err}`);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      message: 'Authentication error',
      success: false,
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if valid token is present, continues regardless
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return next();
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    req.user = decoded;
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-user-email'] = decoded.email;
    if (decoded.name) {
      req.headers['x-user-name'] = decoded.name.replace(/[\r\n]/g, '');
    }
  } catch {
    // Invalid/expired token on optional auth — continue without user
  }

  next();
};

export default authHandler;