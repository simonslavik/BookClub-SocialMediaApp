import { Request, Response } from 'express';
/**
 * Send password reset email
 * POST /auth/forgot-password
 */
export declare const forgotPassword: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Reset password using token
 * POST /auth/reset-password
 */
export declare const resetPassword: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Send email verification
 * Called during registration
 */
export declare const sendVerificationEmail: (userId: string, email: string) => Promise<string>;
/**
 * Verify email with token
 * GET /auth/verify-email?token=xxx
 */
export declare const verifyEmail: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Resend verification email
 * POST /auth/resend-verification
 */
export declare const resendVerification: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=authController.d.ts.map