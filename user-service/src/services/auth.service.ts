import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { UserRepository } from '../repositories/user.repository.js';
import { TokenRepository } from '../repositories/token.repository.js';
import { generateTokens } from '../utils/tokenUtils.js';
import { BCRYPT_SALT_ROUNDS } from '../constants/index.js';
import { logger } from '../utils/logger.js';

/**
 * Service layer for authentication operations
 */
export class AuthService {
  /**
   * Register a new user
   */
  static async register(name: string, email: string, password: string) {
    // Check if user exists
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('EMAIL_EXISTS');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Create user
    const newUser = await UserRepository.create({
      name,
      email,
      password: hashedPassword,
      emailVerified: false,
    });

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    logger.info({
      type: 'USER_REGISTERED',
      userId: newUser.id,
      email: newUser.email,
    });

    return {
      user: { ...newUser, emailVerified: false },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user with email and password
   */
  static async login(email: string, password: string) {
    // Find user
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Verify password
    if (!user.password) {
      throw new Error('OAUTH_USER');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    logger.info({
      type: 'USER_LOGIN',
      userId: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Logout user (revoke refresh token)
   */
  static async logout(refreshToken: string) {
    await TokenRepository.deleteRefreshToken(refreshToken);
    logger.info({ type: 'USER_LOGOUT' });
  }

  /**
   * Logout from all devices
   */
  static async logoutAll(userId: string) {
    await TokenRepository.deleteAllUserTokens(userId);
    logger.info({ type: 'USER_LOGOUT_ALL', userId });
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string) {
    const user = await UserRepository.findByEmail(email);
    
    // Don't reveal if email exists
    if (!user) {
      logger.warn({ type: 'PASSWORD_RESET_REQUESTED', email, found: false });
      return { resetToken: null };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set expiration to 1 hour
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);

    // Save hashed token
    await UserRepository.setPasswordResetToken(user.id, hashedToken, resetExpires);

    logger.info({
      type: 'PASSWORD_RESET_REQUESTED',
      userId: user.id,
      email: user.email,
    });

    // Return token for email sending (in development, for testing)
    return { resetToken, expiresAt: resetExpires };
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, newPassword: string) {
    // Hash token to compare with DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user by token
    const user = await UserRepository.findByPasswordResetToken(hashedToken);
    
    if (!user) {
      throw new Error('INVALID_TOKEN');
    }

    // Check if token expired
    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      throw new Error('TOKEN_EXPIRED');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // Update password and clear reset token
    await UserRepository.updatePassword(user.id, hashedPassword);
    await UserRepository.clearPasswordResetToken(user.id);

    // Revoke all refresh tokens for security
    await TokenRepository.deleteAllUserTokens(user.id);

    logger.info({
      type: 'PASSWORD_RESET_SUCCESS',
      userId: user.id,
    });

    return { message: 'Password reset successful' };
  }

  /**
   * Send email verification
   * If userId is null, find user by email (for resend)
   */
  static async sendEmailVerification(userId: string | null, email: string) {
    let user;
    
    if (userId) {
      user = await UserRepository.findById(userId);
    } else {
      user = await UserRepository.findByEmail(email);
    }

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // Check if already verified
    if (user.emailVerified) {
      throw new Error('EMAIL_ALREADY_VERIFIED');
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Set expiration to 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Save token
    await UserRepository.setEmailVerificationToken(user.id, hashedToken, expiresAt);

    logger.info({
      type: 'EMAIL_VERIFICATION_SENT',
      userId: user.id,
      email: user.email,
    });

    // TODO: Send email with verification link
    // const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    return verificationToken; // Return for development (changed from object)
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token: string) {
    // Hash token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user by token
    const user = await UserRepository.findByEmailVerificationToken(hashedToken);
    
    if (!user) {
      throw new Error('INVALID_TOKEN');
    }

    // Check if token expired
    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      throw new Error('TOKEN_EXPIRED');
    }

    // Verify email
    await UserRepository.verifyEmail(user.id);

    logger.info({
      type: 'EMAIL_VERIFIED',
      userId: user.id,
      email: user.email,
    });

    return { message: 'Email verified successfully' };
  }

  /**
   * Change password for authenticated user
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await UserRepository.findById(userId, false);
    
    if (!user || !user.password) {
      throw new Error('USER_NOT_FOUND');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('INVALID_PASSWORD');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // Update password
    await UserRepository.updatePassword(userId, hashedPassword);

    // Revoke all refresh tokens
    await TokenRepository.deleteAllUserTokens(userId);

    logger.info({
      type: 'PASSWORD_CHANGED',
      userId,
    });

    return { message: 'Password changed successfully' };
  }
}
