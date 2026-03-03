/**
 * Repository layer for RefreshToken database operations
 */
export declare class TokenRepository {
    /**
     * Create refresh token
     */
    static createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        token: string;
        expiresAt: Date;
    }>;
    /**
     * Find refresh token
     */
    static findRefreshToken(token: string): Promise<({
        user: {
            id: string;
            email: string;
            googleId: string | null;
            emailVerificationToken: string | null;
            passwordResetToken: string | null;
            password: string | null;
            name: string;
            authProvider: string;
            emailVerified: boolean;
            emailVerificationExpires: Date | null;
            passwordResetExpires: Date | null;
            createdAt: Date;
            updatedAt: Date;
            profileImage: string | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        token: string;
        expiresAt: Date;
    }) | null>;
    /**
     * Delete refresh token
     */
    static deleteRefreshToken(token: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        token: string;
        expiresAt: Date;
    }>;
    /**
     * Delete all user's refresh tokens
     */
    static deleteAllUserTokens(userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    /**
     * Delete expired refresh tokens
     */
    static deleteExpiredTokens(): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
//# sourceMappingURL=token.repository.d.ts.map