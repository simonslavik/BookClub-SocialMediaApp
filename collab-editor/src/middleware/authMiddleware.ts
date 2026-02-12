import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request to include user property
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
            };
        }
    }
}

// Export AuthRequest type for use in controllers
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

interface TokenPayload {
    userId: string;
    email: string;
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
                message: 'No authorization token provided' 
            });
        }

        // Expected format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        const parts = authHeader.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({ 
                message: 'Invalid authorization format. Expected: Bearer <token>' 
            });
        }

        const token = parts[1];

        // Verify token
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            return res.status(500).json({ 
                message: 'Server configuration error' 
            });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

        // Attach user info to request
        req.user = {
            userId: decoded.userId,
            email: decoded.email
        };

        next();
    } catch (error: any) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Invalid token' 
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token expired' 
            });
        }

        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
            message: 'Internal server error during authentication' 
        });
    }
};

/**
 * Optional auth middleware - doesn't fail if no token provided
 * Just attaches user info if token is valid
 */
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return next();
        }

        const parts = authHeader.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return next();
        }

        const token = parts[1];
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) return next();
        
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

        req.user = {
            userId: decoded.userId,
            email: decoded.email
        };

        next();
    } catch (error) {
        // If token is invalid, just continue without user
        next();
    }
};
