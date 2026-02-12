import prisma from '../config/database.js';
import { USER_PUBLIC_FIELDS, USER_BASIC_FIELDS } from '../constants/index.js';

/**
 * Repository layer for User database operations
 */
export class UserRepository {
  /**
   * Find user by ID
   */
  static async findById(userId: string, includePublicOnly = true) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: includePublicOnly ? USER_PUBLIC_FIELDS : undefined,
    });
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by Google ID
   */
  static async findByGoogleId(googleId: string) {
    return await prisma.user.findUnique({
      where: { googleId },
    });
  }

  /**
   * Find user by email verification token
   */
  static async findByEmailVerificationToken(token: string) {
    return await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });
  }

  /**
   * Find user by password reset token
   */
  static async findByPasswordResetToken(token: string) {
    return await prisma.user.findUnique({
      where: { passwordResetToken: token },
    });
  }

  /**
   * Create new user
   */
  static async create(data: {
    name: string;
    email: string;
    password?: string;
    googleId?: string;
    authProvider?: string;
    emailVerified?: boolean;
    profileImage?: string | null;
  }) {
    return await prisma.user.create({
      data,
      select: USER_PUBLIC_FIELDS,
    });
  }

  /**
   * Update user
   */
  static async update(userId: string, data: any) {
    return await prisma.user.update({
      where: { id: userId },
      data,
      select: USER_PUBLIC_FIELDS,
    });
  }

  /**
   * Update user password
   */
  static async updatePassword(userId: string, hashedPassword: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: USER_PUBLIC_FIELDS,
    });
  }

  /**
   * Set email verification token
   */
  static async setEmailVerificationToken(userId: string, token: string, expiresAt: Date) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: token,
        emailVerificationExpires: expiresAt,
      },
    });
  }

  /**
   * Verify email
   */
  static async verifyEmail(userId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });
  }

  /**
   * Set password reset token
   */
  static async setPasswordResetToken(userId: string, hashedToken: string, expiresAt: Date) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: expiresAt,
      },
    });
  }

  /**
   * Clear password reset token
   */
  static async clearPasswordResetToken(userId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }

  /**
   * Delete user
   */
  static async delete(userId: string) {
    return await prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Search users by name or email
   */
  static async search(query: string, limit = 10) {
    return await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: USER_BASIC_FIELDS,
      take: limit,
    });
  }

  /**
   * Get all users (admin)
   */
  static async findAll() {
    return await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get multiple users by IDs
   */
  static async findManyByIds(userIds: string[]) {
    return await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: USER_BASIC_FIELDS,
    });
  }
}
