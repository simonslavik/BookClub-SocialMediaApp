import { AuthService } from '../services/auth.service.js';
import { logger, logError } from '../utils/logger.js';
/**
 * Send password reset email
 * POST /auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const resetToken = await AuthService.requestPasswordReset(email);
        // Always return success to prevent email enumeration
        logger.info({
            type: 'PASSWORD_RESET_REQUESTED',
            email,
            found: !!resetToken
        });
        // For development, return the token (REMOVE IN PRODUCTION)
        if (process.env.NODE_ENV === 'development' && resetToken) {
            return res.status(200).json({
                message: 'Password reset token generated',
                resetToken, // Only for development!
            });
        }
        res.status(200).json({
            message: 'If an account with that email exists, a password reset link has been sent'
        });
    }
    catch (error) {
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
export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        await AuthService.resetPassword(token, password);
        logger.info({
            type: 'PASSWORD_RESET_SUCCESS'
        });
        res.status(200).json({
            message: 'Password has been reset successfully. Please login with your new password.'
        });
    }
    catch (error) {
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
export const sendVerificationEmail = async (userId, email) => {
    try {
        const verificationToken = await AuthService.sendEmailVerification(userId, email);
        logger.info({
            type: 'EMAIL_VERIFICATION_SENT',
            userId,
            email
        });
        return verificationToken; // Return for development
    }
    catch (error) {
        logError(error, 'Send verification email error', { userId, email });
        throw error;
    }
};
/**
 * Verify email with token
 * GET /auth/verify-email?token=xxx
 */
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        await AuthService.verifyEmail(token);
        logger.info({
            type: 'EMAIL_VERIFIED'
        });
        res.status(200).json({
            message: 'Email verified successfully! You can now login.'
        });
    }
    catch (error) {
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
export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        await AuthService.sendEmailVerification(null, email);
        res.status(200).json({
            message: 'Verification email sent'
        });
    }
    catch (error) {
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
//# sourceMappingURL=authController.js.map