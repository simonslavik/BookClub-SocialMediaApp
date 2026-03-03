import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { UserRepository } from '../repositories/user.repository.js';
import { TokenRepository } from '../repositories/token.repository.js';
import { generateTokens } from '../utils/tokenUtils.js';
import { BCRYPT_SALT_ROUNDS } from '../constants/index.js';
import { logger } from '../utils/logger.js';
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } from '../utils/errors.js';
import { authenticationAttempts } from '../utils/metrics.js';
import * as EmailService from './email.service.js';

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
      authenticationAttempts.inc({ type: 'register', result: 'failure' });
      throw new ConflictError('Email already in use');
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

    authenticationAttempts.inc({ type: 'register', result: 'success' });
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
    const user = await UserRepository.findByEmailWithPassword(email);
    if (!user) {
      authenticationAttempts.inc({ type: 'login', result: 'failure' });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    if (!user.password) {
      authenticationAttempts.inc({ type: 'login', result: 'failure' });
      throw new UnauthorizedError('Please use Google login for this account');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      authenticationAttempts.inc({ type: 'login', result: 'failure' });
      throw new UnauthorizedError('Invalid email or password');
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
        authProvider: user.authProvider || 'local',
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
    const user = await UserRepository.findByEmailWithPassword(email);
    
    // Don't reveal if email exists
    if (!user) {
      logger.warn({ type: 'PASSWORD_RESET_REQUESTED', email, found: false });
      return { resetToken: null };
    }

    // Check if user signed up with OAuth (Google, etc.)
    if (!user.password || user.authProvider === 'google') {
      logger.warn({ 
        type: 'PASSWORD_RESET_REQUESTED_OAUTH_USER', 
        email, 
        authProvider: user.authProvider 
      });
      // Don't reveal that this is an OAuth account for security
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

    // Send password reset email
    try {
      await EmailService.sendPasswordResetEmail(user.email, resetToken, user.name);
    } catch (emailError) {
      // Log but don't throw - token is still valid even if email fails
      logger.error({
        type: 'PASSWORD_RESET_EMAIL_FAILED',
        userId: user.id,
        email: user.email,
      });
    }

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

    // Send verification email
    try {
      await EmailService.sendVerificationEmail(user.email, verificationToken, user.name);
    } catch (emailError) {
      // Log but don't throw - token is still valid even if email fails
      logger.error({
        type: 'VERIFICATION_EMAIL_FAILED',
        userId: user.id,
        email: user.email,
      });
    }
    
    // Return token in development mode for testing
    if (process.env.NODE_ENV === 'development') {
      return verificationToken;
    }
    
    return null; // Don't return token in production
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
    logger.info('CHANGE_PASSWORD_SERVICE_START', { userId });
    
    const user = await UserRepository.findById(userId, false);
    
    if (!user) {
      logger.warn('CHANGE_PASSWORD_USER_NOT_FOUND', { userId });
      throw new Error('USER_NOT_FOUND');
    }

    logger.info('CHANGE_PASSWORD_USER_FOUND', {
      userId,
      hasPassword: !!user.password,
      authProvider: user.authProvider
    });

    // Check if user signed up with OAuth (Google, etc.)
    if (!user.password || user.authProvider === 'google') {
      logger.warn('CHANGE_PASSWORD_OAUTH_USER', { userId, authProvider: user.authProvider });
      throw new Error('OAUTH_USER_NO_PASSWORD');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    logger.info('CHANGE_PASSWORD_CURRENT_PASSWORD_CHECK', {
      userId,
      isValid: isPasswordValid
    });
    
    if (!isPasswordValid) {
      logger.warn('CHANGE_PASSWORD_INVALID_PASSWORD', { userId });
      throw new Error('INVALID_PASSWORD');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    logger.info('CHANGE_PASSWORD_NEW_PASSWORD_HASHED', { userId });

    // Update password
    await UserRepository.updatePassword(userId, hashedPassword);
    logger.info('CHANGE_PASSWORD_DB_UPDATED', { userId });

    // Revoke all refresh tokens
    await TokenRepository.deleteAllUserTokens(userId);
    logger.info('CHANGE_PASSWORD_TOKENS_REVOKED', { userId });

    logger.info('CHANGE_PASSWORD_SUCCESS', { userId });

    return { message: 'Password changed successfully' };
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   */
  static async revokeAllRefreshTokens(userId: string) {
    await TokenRepository.deleteAllUserTokens(userId);

    logger.info({
      type: 'ALL_TOKENS_REVOKED',
      userId,
    });

    return { message: 'Logged out from all devices successfully' };
  }
}
