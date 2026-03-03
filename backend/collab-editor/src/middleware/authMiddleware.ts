import { Request, Response, NextFunction } from 'express';

// Extend Express Request to include user property
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                name?: string;
            };
        }
    }
}

// Export AuthRequest type for use in controllers
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        name?: string;
    };
}

/**
 * Authentication middleware — trusts x-user-id header set by the API gateway.
 * The gateway has already verified the JWT and forwards user info as headers.
 * 
 * IMPORTANT: This service must NEVER be exposed publicly.
 * Only the gateway (and WebSocket on port 4000) should be accessible from outside.
 * WebSocket auth still uses JWT directly (see websocketAuth.ts).
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;
    const userName = req.headers['x-user-name'] as string;

    if (!userId) {
        return res.status(401).json({ 
            message: 'Authentication required' 
        });
    }

    req.user = {
        userId,
        email: userEmail || '',
        name: userName || undefined
    };

    next();
};

/**
 * Optional auth middleware — attaches user info if gateway forwarded it, continues regardless.
 * Used for endpoints that work with or without authentication.
 */
export const optionalAuthMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    const userId = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;
    const userName = req.headers['x-user-name'] as string;

    if (userId) {
        req.user = {
            userId,
            email: userEmail || '',
            name: userName || undefined
        };
    }

    next();
};
