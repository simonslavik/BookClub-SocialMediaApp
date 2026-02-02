import { Request, Response, NextFunction } from 'express';
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
 * Middleware to verify JWT access token
 * Extracts token from Authorization header and verifies it
 * Attaches user info to req.user if valid
 */
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to check if user has specific role(s)
 * Must be used AFTER authMiddleware
 *
 * Usage:
 * router.delete('/users/:id', authMiddleware, requireRole(['ADMIN']), deleteUser)
 */
/**
 * Optional auth middleware - doesn't require token but uses it if present
 * Useful for endpoints that work with or without authentication
 */
export declare const optionalAuthMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=authMiddleware.d.ts.map