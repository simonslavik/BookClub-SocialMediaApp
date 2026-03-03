import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  sendFriendRequestSchema,
  acceptFriendRequestSchema,
  rejectFriendRequestSchema,
  removeFriendSchema,
  sendDirectMessageSchema,
  updateProfileSchema,
  googleAuthSchema,
  uuidParamSchema,
  otherUserIdParamSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  paginationSchema,
} from '../../../src/utils/validation.js';

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should pass with valid data', () => {
      const { error } = registerSchema.validate({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Test@1234',
      });
      expect(error).toBeUndefined();
    });

    it('should fail without name', () => {
      const { error } = registerSchema.validate({
        email: 'john@example.com',
        password: 'Test@1234',
      });
      expect(error).toBeDefined();
    });

    it('should fail with short name', () => {
      const { error } = registerSchema.validate({
        name: 'ab',
        email: 'john@example.com',
        password: 'Test@1234',
      });
      expect(error).toBeDefined();
      expect(error!.details[0].message).toContain('at least 3 characters');
    });

    it('should fail without email', () => {
      const { error } = registerSchema.validate({
        name: 'John',
        password: 'Test@1234',
      });
      expect(error).toBeDefined();
    });

    it('should fail with invalid email', () => {
      const { error } = registerSchema.validate({
        name: 'John',
        email: 'not-an-email',
        password: 'Test@1234',
      });
      expect(error).toBeDefined();
    });

    it('should fail without password', () => {
      const { error } = registerSchema.validate({
        name: 'John',
        email: 'john@example.com',
      });
      expect(error).toBeDefined();
    });

    it('should fail with weak password (no uppercase)', () => {
      const { error } = registerSchema.validate({
        name: 'John',
        email: 'john@example.com',
        password: 'test@1234',
      });
      expect(error).toBeDefined();
    });

    it('should fail with weak password (no special char)', () => {
      const { error } = registerSchema.validate({
        name: 'John',
        email: 'john@example.com',
        password: 'Test12345',
      });
      expect(error).toBeDefined();
    });

    it('should fail with short password', () => {
      const { error } = registerSchema.validate({
        name: 'John',
        email: 'john@example.com',
        password: 'Te@1',
      });
      expect(error).toBeDefined();
    });

    it('should trim and lowercase email', () => {
      const { value } = registerSchema.validate({
        name: '  John  ',
        email: '  JOHN@EXAMPLE.COM  ',
        password: 'Test@1234',
      });
      expect(value.email).toBe('john@example.com');
      expect(value.name).toBe('John');
    });
  });

  describe('loginSchema', () => {
    it('should pass with valid data', () => {
      const { error } = loginSchema.validate({
        email: 'john@example.com',
        password: 'Test@1234',
      });
      expect(error).toBeUndefined();
    });

    it('should fail without email', () => {
      const { error } = loginSchema.validate({ password: 'Test@1234' });
      expect(error).toBeDefined();
    });

    it('should fail without password', () => {
      const { error } = loginSchema.validate({ email: 'john@example.com' });
      expect(error).toBeDefined();
    });
  });

  describe('refreshTokenSchema', () => {
    it('should pass with valid refreshToken', () => {
      const { error } = refreshTokenSchema.validate({ refreshToken: 'some-token' });
      expect(error).toBeUndefined();
    });

    it('should fail without refreshToken', () => {
      const { error } = refreshTokenSchema.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('logoutSchema', () => {
    it('should pass with valid refreshToken', () => {
      const { error } = logoutSchema.validate({ refreshToken: 'some-token' });
      expect(error).toBeUndefined();
    });

    it('should fail without refreshToken', () => {
      const { error } = logoutSchema.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('sendFriendRequestSchema', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';

    it('should pass with valid UUID', () => {
      const { error } = sendFriendRequestSchema.validate({ recipientId: validUuid });
      expect(error).toBeUndefined();
    });

    it('should fail with invalid UUID', () => {
      const { error } = sendFriendRequestSchema.validate({ recipientId: 'not-a-uuid' });
      expect(error).toBeDefined();
    });

    it('should fail without recipientId', () => {
      const { error } = sendFriendRequestSchema.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('acceptFriendRequestSchema', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';

    it('should pass with valid UUID', () => {
      const { error } = acceptFriendRequestSchema.validate({ requestId: validUuid });
      expect(error).toBeUndefined();
    });

    it('should fail without requestId', () => {
      const { error } = acceptFriendRequestSchema.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('rejectFriendRequestSchema', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';

    it('should pass with valid UUID', () => {
      const { error } = rejectFriendRequestSchema.validate({ requestId: validUuid });
      expect(error).toBeUndefined();
    });

    it('should fail without requestId', () => {
      const { error } = rejectFriendRequestSchema.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('removeFriendSchema', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';

    it('should pass with valid UUID', () => {
      const { error } = removeFriendSchema.validate({ friendId: validUuid });
      expect(error).toBeUndefined();
    });

    it('should fail without friendId', () => {
      const { error } = removeFriendSchema.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('sendDirectMessageSchema', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';

    it('should pass with content', () => {
      const { error } = sendDirectMessageSchema.validate({
        receiverId: validUuid,
        content: 'Hello!',
      });
      expect(error).toBeUndefined();
    });

    it('should pass with attachments only', () => {
      const { error } = sendDirectMessageSchema.validate({
        receiverId: validUuid,
        content: '',
        attachments: [{ url: 'file.png' }],
      });
      expect(error).toBeUndefined();
    });

    it('should fail without content and attachments', () => {
      const { error } = sendDirectMessageSchema.validate({
        receiverId: validUuid,
      });
      expect(error).toBeDefined();
    });

    it('should fail without receiverId', () => {
      const { error } = sendDirectMessageSchema.validate({
        content: 'Hello!',
      });
      expect(error).toBeDefined();
    });

    it('should fail with content exceeding 5000 chars', () => {
      const { error } = sendDirectMessageSchema.validate({
        receiverId: validUuid,
        content: 'x'.repeat(5001),
      });
      expect(error).toBeDefined();
    });
  });

  describe('updateProfileSchema', () => {
    it('should pass with valid name', () => {
      const { error } = updateProfileSchema.validate({ name: 'New Name' });
      expect(error).toBeUndefined();
    });

    it('should fail with short name', () => {
      const { error } = updateProfileSchema.validate({ name: 'ab' });
      expect(error).toBeDefined();
    });

    it('should fail with long name', () => {
      const { error } = updateProfileSchema.validate({ name: 'a'.repeat(51) });
      expect(error).toBeDefined();
    });
  });

  describe('googleAuthSchema', () => {
    it('should pass with credential', () => {
      const { error } = googleAuthSchema.validate({ credential: 'google-token' });
      expect(error).toBeUndefined();
    });

    it('should fail without credential', () => {
      const { error } = googleAuthSchema.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('uuidParamSchema', () => {
    it('should pass with valid UUID', () => {
      const { error } = uuidParamSchema.validate({ userId: '550e8400-e29b-41d4-a716-446655440000' });
      expect(error).toBeUndefined();
    });

    it('should fail with invalid UUID', () => {
      const { error } = uuidParamSchema.validate({ userId: 'invalid' });
      expect(error).toBeDefined();
    });
  });

  describe('otherUserIdParamSchema', () => {
    it('should pass with valid UUID', () => {
      const { error } = otherUserIdParamSchema.validate({ otherUserId: '550e8400-e29b-41d4-a716-446655440000' });
      expect(error).toBeUndefined();
    });

    it('should fail with invalid UUID', () => {
      const { error } = otherUserIdParamSchema.validate({ otherUserId: 'invalid' });
      expect(error).toBeDefined();
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should pass with valid email', () => {
      const { error } = forgotPasswordSchema.validate({ email: 'john@example.com' });
      expect(error).toBeUndefined();
    });

    it('should fail with invalid email', () => {
      const { error } = forgotPasswordSchema.validate({ email: 'invalid' });
      expect(error).toBeDefined();
    });
  });

  describe('resetPasswordSchema', () => {
    it('should pass with valid token and strong password', () => {
      const { error } = resetPasswordSchema.validate({
        token: 'reset-token',
        password: 'NewPass@123',
      });
      expect(error).toBeUndefined();
    });

    it('should fail with weak password', () => {
      const { error } = resetPasswordSchema.validate({
        token: 'reset-token',
        password: 'weak',
      });
      expect(error).toBeDefined();
    });

    it('should fail without token', () => {
      const { error } = resetPasswordSchema.validate({
        password: 'NewPass@123',
      });
      expect(error).toBeDefined();
    });
  });

  describe('changePasswordSchema', () => {
    it('should pass with valid current and new passwords', () => {
      const { error } = changePasswordSchema.validate({
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@123',
      });
      expect(error).toBeUndefined();
    });

    it('should fail without currentPassword', () => {
      const { error } = changePasswordSchema.validate({
        newPassword: 'NewPass@123',
      });
      expect(error).toBeDefined();
    });

    it('should fail with weak newPassword', () => {
      const { error } = changePasswordSchema.validate({
        currentPassword: 'OldPass@123',
        newPassword: 'weak',
      });
      expect(error).toBeDefined();
    });
  });

  describe('verifyEmailSchema', () => {
    it('should pass with token', () => {
      const { error } = verifyEmailSchema.validate({ token: 'verify-token' });
      expect(error).toBeUndefined();
    });

    it('should fail without token', () => {
      const { error } = verifyEmailSchema.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('resendVerificationSchema', () => {
    it('should pass with valid email', () => {
      const { error } = resendVerificationSchema.validate({ email: 'john@example.com' });
      expect(error).toBeUndefined();
    });

    it('should fail with invalid email', () => {
      const { error } = resendVerificationSchema.validate({ email: 'bad' });
      expect(error).toBeDefined();
    });
  });

  describe('paginationSchema', () => {
    it('should pass with valid page and limit', () => {
      const { error, value } = paginationSchema.validate({ page: 2, limit: 50 });
      expect(error).toBeUndefined();
      expect(value.page).toBe(2);
      expect(value.limit).toBe(50);
    });

    it('should apply defaults', () => {
      const { error, value } = paginationSchema.validate({});
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(20);
    });

    it('should fail with page < 1', () => {
      const { error } = paginationSchema.validate({ page: 0 });
      expect(error).toBeDefined();
    });

    it('should fail with limit > 100', () => {
      const { error } = paginationSchema.validate({ limit: 101 });
      expect(error).toBeDefined();
    });
  });
});
