import { Request, Response, NextFunction } from 'express';

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
  const userName = req.headers['x-user-name'] as string;

  if (!userId) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  req.user = {
    userId,
    email: userEmail || '',
    role: 'user',
    name: userName || undefined,
  };

  next();
};
