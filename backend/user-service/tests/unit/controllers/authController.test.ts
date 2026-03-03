import { jest } from '@jest/globals';
import { Request, Response } from 'express';

// Mock dependencies before imports
jest.mock('../../../src/utils/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  logError: jest.fn(),
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockAuthService = {
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
  sendEmailVerification: jest.fn(),
  verifyEmail: jest.fn(),
  changePassword: jest.fn(),
};

jest.mock('../../../src/services/auth.service.js', () => ({
  AuthService: mockAuthService,
}));

import {
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  resendVerification,
  changePassword,
} from '../../../src/controllers/authController.js';

describe('AuthController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    mockReq = { body: {}, query: {}, user: undefined };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  // ─── forgotPassword ──────────────────────────────
  describe('forgotPassword', () => {
    it('should return 200 with generic message in non-dev mode', async () => {
      mockReq.body = { email: 'john@test.com' };
      mockAuthService.requestPasswordReset.mockResolvedValue({ resetToken: 'token-123' });

      await forgotPassword(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'If an account with that email exists, a password reset link has been sent',
        })
      );
    });

    it('should include reset token in development mode', async () => {
      process.env.NODE_ENV = 'development';
      mockReq.body = { email: 'john@test.com' };
      mockAuthService.requestPasswordReset.mockResolvedValue({ resetToken: 'token-123' });

      await forgotPassword(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ resetToken: 'token-123' })
      );
    });

    it('should return 200 even when user not found (prevent enumeration)', async () => {
      mockReq.body = { email: 'nobody@test.com' };
      mockAuthService.requestPasswordReset.mockResolvedValue(null);

      await forgotPassword(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 on unexpected error', async () => {
      mockReq.body = { email: 'john@test.com' };
      mockAuthService.requestPasswordReset.mockRejectedValue(new Error('DB error'));

      await forgotPassword(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── resetPassword ──────────────────────────────
  describe('resetPassword', () => {
    it('should reset password and return 200', async () => {
      mockReq.body = { token: 'valid-token', password: 'NewPass123!' };
      mockAuthService.resetPassword.mockResolvedValue(undefined);

      await resetPassword(mockReq as Request, mockRes as Response);

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith('valid-token', 'NewPass123!');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 for invalid token', async () => {
      mockReq.body = { token: 'bad-token', password: 'NewPass123!' };
      mockAuthService.resetPassword.mockRejectedValue(new Error('INVALID_TOKEN'));

      await resetPassword(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid or expired reset token' })
      );
    });

    it('should return 400 for expired token', async () => {
      mockReq.body = { token: 'expired-token', password: 'NewPass123!' };
      mockAuthService.resetPassword.mockRejectedValue(new Error('TOKEN_EXPIRED'));

      await resetPassword(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 on unexpected error', async () => {
      mockReq.body = { token: 'token', password: 'pass' };
      mockAuthService.resetPassword.mockRejectedValue(new Error('DB error'));

      await resetPassword(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── sendVerificationEmail ──────────────────────────────
  describe('sendVerificationEmail', () => {
    it('should send verification email and return token', async () => {
      mockAuthService.sendEmailVerification.mockResolvedValue('v-token-123');

      const result = await sendVerificationEmail('u-1', 'john@test.com');

      expect(mockAuthService.sendEmailVerification).toHaveBeenCalledWith('u-1', 'john@test.com');
      expect(result).toBe('v-token-123');
    });

    it('should throw error on failure', async () => {
      mockAuthService.sendEmailVerification.mockRejectedValue(new Error('Email failed'));

      await expect(sendVerificationEmail('u-1', 'john@test.com'))
        .rejects.toThrow('Email failed');
    });
  });

  // ─── verifyEmail ──────────────────────────────
  describe('verifyEmail', () => {
    it('should verify email and return 200', async () => {
      mockReq.query = { token: 'valid-token' };
      mockAuthService.verifyEmail.mockResolvedValue(undefined);

      await verifyEmail(mockReq as Request, mockRes as Response);

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith('valid-token');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Email verified successfully! You can now login.' })
      );
    });

    it('should return 400 for invalid verification token', async () => {
      mockReq.query = { token: 'bad-token' };
      mockAuthService.verifyEmail.mockRejectedValue(new Error('INVALID_TOKEN'));

      await verifyEmail(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for expired verification token', async () => {
      mockReq.query = { token: 'expired' };
      mockAuthService.verifyEmail.mockRejectedValue(new Error('TOKEN_EXPIRED'));

      await verifyEmail(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 on unexpected error', async () => {
      mockReq.query = { token: 'token' };
      mockAuthService.verifyEmail.mockRejectedValue(new Error('DB error'));

      await verifyEmail(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── resendVerification ──────────────────────────────
  describe('resendVerification', () => {
    it('should resend verification email and return 200', async () => {
      mockReq.body = { email: 'john@test.com' };
      mockAuthService.sendEmailVerification.mockResolvedValue('v-token');

      await resendVerification(mockReq as Request, mockRes as Response);

      expect(mockAuthService.sendEmailVerification).toHaveBeenCalledWith(null, 'john@test.com');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Verification email sent' })
      );
    });

    it('should return 200 even when user not found (prevent enumeration)', async () => {
      mockReq.body = { email: 'nobody@test.com' };
      mockAuthService.sendEmailVerification.mockRejectedValue(new Error('USER_NOT_FOUND'));

      await resendVerification(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 200 when email already verified', async () => {
      mockReq.body = { email: 'verified@test.com' };
      mockAuthService.sendEmailVerification.mockRejectedValue(new Error('EMAIL_ALREADY_VERIFIED'));

      await resendVerification(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Email is already verified' })
      );
    });

    it('should return 500 on unexpected error', async () => {
      mockReq.body = { email: 'john@test.com' };
      mockAuthService.sendEmailVerification.mockRejectedValue(new Error('SMTP error'));

      await resendVerification(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── changePassword ──────────────────────────────
  describe('changePassword', () => {
    it('should change password and return 200', async () => {
      (mockReq as any).user = { userId: 'u-1' };
      mockReq.body = { currentPassword: 'OldPass1!', newPassword: 'NewPass1!' };
      mockAuthService.changePassword.mockResolvedValue(undefined);

      await changePassword(mockReq as Request, mockRes as Response);

      expect(mockAuthService.changePassword).toHaveBeenCalledWith('u-1', 'OldPass1!', 'NewPass1!');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 401 when not authenticated', async () => {
      mockReq.body = { currentPassword: 'old', newPassword: 'new' };

      await changePassword(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 when current password is incorrect', async () => {
      (mockReq as any).user = { userId: 'u-1' };
      mockReq.body = { currentPassword: 'wrong', newPassword: 'NewPass1!' };
      mockAuthService.changePassword.mockRejectedValue(new Error('INVALID_PASSWORD'));

      await changePassword(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Current password is incorrect' })
      );
    });

    it('should return 400 for OAuth user', async () => {
      (mockReq as any).user = { userId: 'u-1' };
      mockReq.body = { currentPassword: 'pass', newPassword: 'NewPass1!' };
      mockAuthService.changePassword.mockRejectedValue(new Error('OAUTH_USER_NO_PASSWORD'));

      await changePassword(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when user not found', async () => {
      (mockReq as any).user = { userId: 'u-99' };
      mockReq.body = { currentPassword: 'pass', newPassword: 'NewPass1!' };
      mockAuthService.changePassword.mockRejectedValue(new Error('USER_NOT_FOUND'));

      await changePassword(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on unexpected error', async () => {
      (mockReq as any).user = { userId: 'u-1' };
      mockReq.body = { currentPassword: 'pass', newPassword: 'NewPass1!' };
      mockAuthService.changePassword.mockRejectedValue(new Error('DB error'));

      await changePassword(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
