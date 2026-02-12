import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

// Extend Express Request to include user property
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    name?: string;
  };
  bookClubRole?: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
        name?: string;
      };
      bookClubRole?: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
    }
  }
}

interface TokenPayload {
  userId: string;
  email: string;
  role?: string;
  name?: string;
  iat: number;
  exp: number;
}

/**
 * Middleware to verify JWT access token
 * Extracts token from Authorization header and verifies it
 * Attaches user info to req.user if valid
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: 'No authorization token provided',
      });
    }

    // Expected format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        message: 'Invalid authorization format. Expected: Bearer <token>',
      });
    }

    const token = parts[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

    // Attach user info to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
      name: decoded.name,
    };

    // Continue to next middleware/controller
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired. Please refresh your token.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token',
      });
    }

    logger.error('Auth middleware error:', { error: error.message, stack: error.stack });
    return res.status(500).json({
      message: 'Authentication error',
    });
  }
};
