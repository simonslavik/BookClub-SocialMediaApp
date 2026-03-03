import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { logger, logError } from '../utils/logger.js';

/**
 * Send password reset email
 * POST /auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        const result = await AuthService.requestPasswordReset(email);

        // Always return success to prevent email enumeration
        logger.info({
            type: 'PASSWORD_RESET_REQUESTED',
            email,
            found: !!result
        });

        // For development, return the token (REMOVE IN PRODUCTION)
        if (process.env.NODE_ENV === 'development' && result) {
            return res.status(200).json({
                message: 'Password reset token generated',
                resetToken: result.resetToken, // Extract token from result object
            });
        }

        res.status(200).json({
            message: 'If an account with that email exists, a password reset link has been sent'
        });
    } catch (error: any) {
        logError(error, 'Forgot password error', { email: req.body.email });
        res.status(500).json({
            message: 'Error processing password reset request'
        });
    }
};

/**
 * Reset password using token
 * POST /auth/reset-password
 */
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;

        await AuthService.resetPassword(token, password);

        logger.info({
            type: 'PASSWORD_RESET_SUCCESS'
        });

        res.status(200).json({
            message: 'Password has been reset successfully. Please login with your new password.'
        });
    } catch (error: any) {
        if (error.message === 'INVALID_TOKEN' || error.message === 'TOKEN_EXPIRED') {
            logger.warn({
                type: 'PASSWORD_RESET_FAILED',
                reason: 'Invalid or expired token'
            });
            return res.status(400).json({
                message: 'Invalid or expired reset token'
            });
        }

        logError(error, 'Reset password error');
        res.status(500).json({
            message: 'Error resetting password'
        });
    }
};

/**
 * Send email verification
 * Called during registration
 */
export const sendVerificationEmail = async (userId: string, email: string) => {
    try {
        const verificationToken = await AuthService.sendEmailVerification(userId, email);

        logger.info({
            type: 'EMAIL_VERIFICATION_SENT',
            userId,
            email
        });

        return verificationToken; // Return for development
    } catch (error) {
        logError(error, 'Send verification email error', { userId, email });
        throw error;
    }
};

/**
 * Verify email with token
 * GET /auth/verify-email?token=xxx
 */
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.query;

        await AuthService.verifyEmail(token as string);

        logger.info({
            type: 'EMAIL_VERIFIED'
        });

        res.status(200).json({
            message: 'Email verified successfully! You can now login.'
        });
    } catch (error: any) {
        if (error.message === 'INVALID_TOKEN' || error.message === 'TOKEN_EXPIRED') {
            logger.warn({
                type: 'EMAIL_VERIFICATION_FAILED',
                reason: 'Invalid or expired token'
            });
            return res.status(400).json({
                message: 'Invalid or expired verification token'
            });
        }

        logError(error, 'Verify email error');
        res.status(500).json({
            message: 'Error verifying email'
        });
    }
};

/**
 * Resend verification email
 * POST /auth/resend-verification
 */
export const resendVerification = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        await AuthService.sendEmailVerification(null, email);

        res.status(200).json({
            message: 'Verification email sent'
        });
    } catch (error: any) {
        if (error.message === 'USER_NOT_FOUND') {
            // Don't reveal if email exists
            return res.status(200).json({
                message: 'If an account with that email exists and is unverified, a verification email has been sent'
            });
        }

        if (error.message === 'EMAIL_ALREADY_VERIFIED') {
            return res.status(200).json({
                message: 'Email is already verified'
            });
        }

        logError(error, 'Resend verification error', { email: req.body.email });
        res.status(500).json({
            message: 'Error sending verification email'
        });
    }
};

/**
 * Change password (for authenticated users)
 * PUT /auth/change-password
 */
export const changePassword = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { currentPassword, newPassword } = req.body;

        logger.info('PASSWORD_CHANGE_REQUEST', {
            userId,
            hasCurrentPassword: !!currentPassword,
            hasNewPassword: !!newPassword,
            currentPasswordLength: currentPassword?.length || 0,
            newPasswordLength: newPassword?.length || 0
        });

        if (!userId) {
            logger.warn('PASSWORD_CHANGE_NO_AUTH');
            return res.status(401).json({
                message: 'Authentication required'
            });
        }

        await AuthService.changePassword(userId, currentPassword, newPassword);

        logger.info('PASSWORD_CHANGED_SUCCESS', { userId });

        res.status(200).json({
            message: 'Password changed successfully. Please login again with your new password.'
        });
    } catch (error: any) {
        logger.error('PASSWORD_CHANGE_ERROR', {
            userId: (req as any).user?.userId,
            errorMessage: error.message,
            errorType: error.message
        });

        if (error.message === 'INVALID_PASSWORD') {
            return res.status(400).json({
                message: 'Current password is incorrect'
            });
        }

        if (error.message === 'OAUTH_USER_NO_PASSWORD') {
            return res.status(400).json({
                message: 'You signed in with Google. Password changes are not available for OAuth accounts.'
            });
        }

        if (error.message === 'USER_NOT_FOUND') {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        logError(error, 'Change password error', { userId: (req as any).user?.userId });
        res.status(500).json({
            message: 'Error changing password'
        });
    }
};
