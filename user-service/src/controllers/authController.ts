import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import prisma from '../config/database.js';
import { logger, logError } from '../utils/logger.js';

/**
 * Send password reset email
 * POST /auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        // Request body is already validated by middleware
        const { email } = req.body;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        // Always return success to prevent email enumeration
        // (Don't reveal if email exists or not)
        if (!user) {
            logger.warn({
                type: 'PASSWORD_RESET_REQUESTED',
                email,
                found: false
            });
            return res.status(200).json({
                message: 'If an account with that email exists, a password reset link has been sent'
            });
        }

        // Generate reset token (random 32-byte hex string)
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Hash the token before storing (prevent token theft from DB breach)
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Set expiration to 1 hour from now
        const resetExpires = new Date();
        resetExpires.setHours(resetExpires.getHours() + 1);

        // Save hashed token to database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: hashedToken,
                passwordResetExpires: resetExpires
            }
        });

        // TODO: Send email with reset link
        // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        // await sendEmail(user.email, 'Password Reset', resetUrl);

        logger.info({
            type: 'PASSWORD_RESET_REQUESTED',
            userId: user.id,
            email: user.email
        });

        // For development, return the token (REMOVE IN PRODUCTION)
        if (process.env.NODE_ENV === 'development') {
            return res.status(200).json({
                message: 'Password reset token generated',
                resetToken, // Only for development!
                expiresAt: resetExpires
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
        // Request body is already validated by middleware
        const { token, password } = req.body;

        // Hash the token to compare with DB
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid reset token
        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: hashedToken,
                passwordResetExpires: {
                    gt: new Date() // Token not expired
                }
            }
        });

        if (!user) {
            logger.warn({
                type: 'PASSWORD_RESET_FAILED',
                reason: 'Invalid or expired token'
            });
            return res.status(400).json({
                message: 'Invalid or expired reset token'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Update password and clear reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null
            }
        });

        // Revoke all existing refresh tokens (force re-login on all devices)
        await prisma.refreshToken.deleteMany({
            where: { userId: user.id }
        });

        logger.info({
            type: 'PASSWORD_RESET_SUCCESS',
            userId: user.id,
            email: user.email
        });

        res.status(200).json({
            message: 'Password has been reset successfully. Please login with your new password.'
        });
    } catch (error: any) {
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
        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        // Hash the token
        const hashedToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');

        // Set expiration to 24 hours
        const verificationExpires = new Date();
        verificationExpires.setHours(verificationExpires.getHours() + 24);

        // Save to database
        await prisma.user.update({
            where: { id: userId },
            data: {
                emailVerificationToken: hashedToken,
                emailVerificationExpires: verificationExpires
            }
        });

        // TODO: Send email
        // const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        // await sendEmail(email, 'Verify Your Email', verifyUrl);

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
        // Request query is already validated by middleware
        const { token } = req.query;

        // Hash the token
        const hashedToken = crypto
            .createHash('sha256')
            .update(token as string)
            .digest('hex');

        // Find user with valid verification token
        const user = await prisma.user.findFirst({
            where: {
                emailVerificationToken: hashedToken,
                emailVerificationExpires: {
                    gt: new Date()
                }
            }
        });

        if (!user) {
            logger.warn({
                type: 'EMAIL_VERIFICATION_FAILED',
                reason: 'Invalid or expired token'
            });
            return res.status(400).json({
                message: 'Invalid or expired verification token'
            });
        }

        // Mark email as verified and clear token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                emailVerificationToken: null,
                emailVerificationExpires: null
            }
        });

        logger.info({
            type: 'EMAIL_VERIFIED',
            userId: user.id,
            email: user.email
        });

        res.status(200).json({
            message: 'Email verified successfully! You can now login.'
        });
    } catch (error: any) {
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
        // Request body is already validated by middleware
        const { email } = req.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        // Don't reveal if email exists
        if (!user) {
            return res.status(200).json({
                message: 'If an account with that email exists and is unverified, a verification email has been sent'
            });
        }

        // Check if already verified
        if (user.emailVerified) {
            return res.status(200).json({
                message: 'Email is already verified'
            });
        }

        // Send new verification email
        await sendVerificationEmail(user.id, user.email);

        res.status(200).json({
            message: 'Verification email sent'
        });
    } catch (error: any) {
        logError(error, 'Resend verification error', { email: req.body.email });
        res.status(500).json({
            message: 'Error sending verification email'
        });
    }
};
