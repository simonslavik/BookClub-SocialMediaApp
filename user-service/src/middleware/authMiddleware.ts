import { Request, Response, NextFunction } from 'express';

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

/**
 * Authentication middleware — trusts x-user-id header set by the API gateway.
 * The gateway has already verified the JWT and forwards user info as headers.
 * 
 * IMPORTANT: This service must NEVER be exposed publicly.
 * Only the gateway should be accessible from outside the Docker network.
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;

    if (!userId) {
        return res.status(401).json({ 
            message: 'Authentication required' 
        });
    }

    req.user = {
        userId,
        email: userEmail || ''
    };

    next();
};


/**
 * Middleware to check if user has specific role(s)
 * Must be used AFTER authMiddleware
 * 
 * Usage: 
 * router.delete('/users/:id', authMiddleware, requireRole(['ADMIN']), deleteUser)
 */
/**
 * Optional auth middleware — attaches user info if gateway forwarded it, continues regardless.
 * Used for endpoints that work with or without authentication.
 */
export const optionalAuthMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    const userId = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;

    if (userId) {
        req.user = {
            userId,
            email: userEmail || ''
        };
    }

    next();
};