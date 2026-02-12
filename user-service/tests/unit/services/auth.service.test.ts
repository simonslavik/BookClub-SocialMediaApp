import { jest } from '@jest/globals';
// Mock dependencies
jest.mock('../../../src/utils/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  logError: jest.fn(),
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../../../src/utils/metrics.js', () => ({
  authenticationAttempts: { inc: jest.fn() },
}));

const mockUserRepo = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updatePassword: jest.fn(),
  clearPasswordResetToken: jest.fn(),
  setPasswordResetToken: jest.fn(),
  findByPasswordResetToken: jest.fn(),
  setEmailVerificationToken: jest.fn(),
  findByEmailVerificationToken: jest.fn(),
  verifyEmail: jest.fn(),
};

const mockTokenRepo = {
  deleteRefreshToken: jest.fn(),
  deleteAllUserTokens: jest.fn(),
};

jest.mock('../../../src/repositories/user.repository.js', () => ({
  UserRepository: mockUserRepo,
}));

jest.mock('../../../src/repositories/token.repository.js', () => ({
  TokenRepository: mockTokenRepo,
}));

jest.mock('../../../src/utils/tokenUtils.js', () => ({
  generateTokens: jest.fn().mockResolvedValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  }),
}));

jest.mock('../../../src/constants/index.js', () => ({
  BCRYPT_SALT_ROUNDS: 2, // Low rounds for fast tests
}));

jest.mock('../../../src/services/email.service.js', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

import { AuthService } from '../../../src/services/auth.service.js';
import bcrypt from 'bcrypt';

describe('AuthService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('should register a new user', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue({
        id: 'user-1',
        name: 'John',
        email: 'john@test.com',
      });

      const result = await AuthService.register('John', 'john@test.com', 'Test@1234');

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('john@test.com');
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John',
          email: 'john@test.com',
          emailVerified: false,
        })
      );
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.user).toBeDefined();
    });

    it('should throw ConflictError when email already exists', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({ id: 'existing' });

      await expect(AuthService.register('John', 'john@test.com', 'Test@1234'))
        .rejects.toThrow('Email already in use');
    });

    it('should hash the password before saving', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue({
        id: 'user-1',
        name: 'John',
        email: 'john@test.com',
      });

      await AuthService.register('John', 'john@test.com', 'Test@1234');

      const createCall = mockUserRepo.create.mock.calls[0][0];
      expect(createCall.password).not.toBe('Test@1234');
      // Verify it's a valid bcrypt hash
      const isHash = await bcrypt.compare('Test@1234', createCall.password);
      expect(isHash).toBe(true);
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const hashedPass = await bcrypt.hash('Test@1234', 2);
      mockUserRepo.findByEmail.mockResolvedValue({
        id: 'user-1',
        name: 'John',
        email: 'john@test.com',
        password: hashedPass,
        profileImage: null,
        authProvider: 'local',
      });

      const result = await AuthService.login('john@test.com', 'Test@1234');

      expect(result.user.email).toBe('john@test.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedError for non-existent user', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      await expect(AuthService.login('nobody@test.com', 'Test@1234'))
        .rejects.toThrow('Invalid email or password');
    });

    it('should throw UnauthorizedError for wrong password', async () => {
      const hashedPass = await bcrypt.hash('Test@1234', 2);
      mockUserRepo.findByEmail.mockResolvedValue({
        id: 'user-1',
        password: hashedPass,
      });

      await expect(AuthService.login('john@test.com', 'WrongPass@1'))
        .rejects.toThrow('Invalid email or password');
    });

    it('should throw for OAuth user without password', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({
        id: 'user-1',
        password: null,
        authProvider: 'google',
      });

      await expect(AuthService.login('john@test.com', 'Test@1234'))
        .rejects.toThrow('Please use Google login');
    });
  });

  describe('logout', () => {
    it('should delete refresh token', async () => {
      mockTokenRepo.deleteRefreshToken.mockResolvedValue(undefined);

      await AuthService.logout('some-token');

      expect(mockTokenRepo.deleteRefreshToken).toHaveBeenCalledWith('some-token');
    });
  });

  describe('logoutAll', () => {
    it('should delete all user tokens', async () => {
      mockTokenRepo.deleteAllUserTokens.mockResolvedValue(undefined);

      await AuthService.logoutAll('user-1');

      expect(mockTokenRepo.deleteAllUserTokens).toHaveBeenCalledWith('user-1');
    });
  });

  describe('requestPasswordReset', () => {
    it('should return null resetToken for non-existent email', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      const result = await AuthService.requestPasswordReset('nobody@test.com');

      expect(result.resetToken).toBeNull();
    });

    it('should return null resetToken for OAuth user', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({
        id: 'u-1',
        password: null,
        authProvider: 'google',
      });

      const result = await AuthService.requestPasswordReset('google@test.com');

      expect(result.resetToken).toBeNull();
    });

    it('should generate reset token for valid user', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({
        id: 'u-1',
        email: 'john@test.com',
        name: 'John',
        password: 'hashed',
        authProvider: 'local',
      });
      mockUserRepo.setPasswordResetToken.mockResolvedValue(undefined);

      const result = await AuthService.requestPasswordReset('john@test.com');

      expect(result.resetToken).toBeDefined();
      expect(mockUserRepo.setPasswordResetToken).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should throw for invalid token', async () => {
      mockUserRepo.findByPasswordResetToken.mockResolvedValue(null);

      await expect(AuthService.resetPassword('bad-token', 'NewPass@123'))
        .rejects.toThrow('INVALID_TOKEN');
    });

    it('should throw for expired token', async () => {
      const expired = new Date();
      expired.setHours(expired.getHours() - 2);
      mockUserRepo.findByPasswordResetToken.mockResolvedValue({
        id: 'u-1',
        passwordResetExpires: expired,
      });

      await expect(AuthService.resetPassword('token', 'NewPass@123'))
        .rejects.toThrow('TOKEN_EXPIRED');
    });

    it('should reset password with valid token', async () => {
      const future = new Date();
      future.setHours(future.getHours() + 1);
      mockUserRepo.findByPasswordResetToken.mockResolvedValue({
        id: 'u-1',
        passwordResetExpires: future,
      });
      mockUserRepo.updatePassword.mockResolvedValue(undefined);
      mockUserRepo.clearPasswordResetToken.mockResolvedValue(undefined);
      mockTokenRepo.deleteAllUserTokens.mockResolvedValue(undefined);

      const result = await AuthService.resetPassword('valid-token', 'NewPass@123');

      expect(mockUserRepo.updatePassword).toHaveBeenCalled();
      expect(mockUserRepo.clearPasswordResetToken).toHaveBeenCalledWith('u-1');
      expect(mockTokenRepo.deleteAllUserTokens).toHaveBeenCalledWith('u-1');
      expect(result.message).toContain('successful');
    });
  });

  describe('changePassword', () => {
    it('should throw for user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(AuthService.changePassword('u-1', 'old', 'new'))
        .rejects.toThrow('USER_NOT_FOUND');
    });

    it('should throw for OAuth user', async () => {
      mockUserRepo.findById.mockResolvedValue({
        id: 'u-1',
        password: null,
        authProvider: 'google',
      });

      await expect(AuthService.changePassword('u-1', 'old', 'NewPass@123'))
        .rejects.toThrow('OAUTH_USER_NO_PASSWORD');
    });

    it('should throw for wrong current password', async () => {
      const hashed = await bcrypt.hash('CorrectPass@1', 2);
      mockUserRepo.findById.mockResolvedValue({
        id: 'u-1',
        password: hashed,
        authProvider: 'local',
      });

      await expect(AuthService.changePassword('u-1', 'WrongPass@1', 'NewPass@123'))
        .rejects.toThrow('INVALID_PASSWORD');
    });

    it('should change password successfully', async () => {
      const hashed = await bcrypt.hash('OldPass@123', 2);
      mockUserRepo.findById.mockResolvedValue({
        id: 'u-1',
        password: hashed,
        authProvider: 'local',
      });
      mockUserRepo.updatePassword.mockResolvedValue({ id: 'u-1', password: 'new-hash' });
      mockTokenRepo.deleteAllUserTokens.mockResolvedValue(undefined);

      const result = await AuthService.changePassword('u-1', 'OldPass@123', 'NewPass@123');

      expect(mockUserRepo.updatePassword).toHaveBeenCalled();
      expect(mockTokenRepo.deleteAllUserTokens).toHaveBeenCalledWith('u-1');
      expect(result.message).toContain('changed');
    });
  });

  describe('verifyEmail', () => {
    it('should throw for invalid token', async () => {
      mockUserRepo.findByEmailVerificationToken.mockResolvedValue(null);

      await expect(AuthService.verifyEmail('bad-token')).rejects.toThrow('INVALID_TOKEN');
    });

    it('should throw for expired token', async () => {
      const expired = new Date();
      expired.setHours(expired.getHours() - 25);
      mockUserRepo.findByEmailVerificationToken.mockResolvedValue({
        id: 'u-1',
        emailVerificationExpires: expired,
      });

      await expect(AuthService.verifyEmail('token')).rejects.toThrow('TOKEN_EXPIRED');
    });

    it('should verify email with valid token', async () => {
      const future = new Date();
      future.setHours(future.getHours() + 1);
      mockUserRepo.findByEmailVerificationToken.mockResolvedValue({
        id: 'u-1',
        email: 'john@test.com',
        emailVerificationExpires: future,
      });
      mockUserRepo.verifyEmail.mockResolvedValue(undefined);

      const result = await AuthService.verifyEmail('valid-token');

      expect(mockUserRepo.verifyEmail).toHaveBeenCalledWith('u-1');
      expect(result.message).toContain('verified');
    });
  });

  describe('revokeAllRefreshTokens', () => {
    it('should revoke all tokens', async () => {
      mockTokenRepo.deleteAllUserTokens.mockResolvedValue(undefined);

      const result = await AuthService.revokeAllRefreshTokens('u-1');

      expect(mockTokenRepo.deleteAllUserTokens).toHaveBeenCalledWith('u-1');
      expect(result.message).toContain('all devices');
    });
  });
});
