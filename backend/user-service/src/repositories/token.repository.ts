import prisma from '../config/database.js';

/**
 * Repository layer for RefreshToken database operations
 */
export class TokenRepository {
  /**
   * Create refresh token
   */
  static async createRefreshToken(userId: string, token: string, expiresAt: Date) {
    return await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  /**
   * Find refresh token
   */
  static async findRefreshToken(token: string) {
    return await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  /**
   * Delete refresh token
   */
  static async deleteRefreshToken(token: string) {
    return await prisma.refreshToken.delete({
      where: { token },
    });
  }

  /**
   * Delete all user's refresh tokens
   */
  static async deleteAllUserTokens(userId: string) {
    return await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  /**
   * Delete expired refresh tokens
   */
  static async deleteExpiredTokens() {
    return await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
