import { Request, Response } from 'express';
/**
 * Get current user's profile
 * Requires authentication
 */
export declare const getProfileById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Update current user's profile
 * Requires authentication
 */
export declare const updateMyProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get any user's profile by ID (admin only)
 * Requires authentication and ADMIN role
 */
export declare const getUserById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * List all users (admin only)
 * Requires authentication and ADMIN role
 */
export declare const listUsers: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Get multiple users by IDs (batch endpoint)
 * No authentication required - used by other services
 */
export declare const getUsersByIds: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=profileController.d.ts.map