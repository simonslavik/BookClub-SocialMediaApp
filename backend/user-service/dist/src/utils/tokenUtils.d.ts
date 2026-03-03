interface User {
    id: string;
    email: string;
    name: string;
}
interface Tokens {
    accessToken: string;
    refreshToken: string;
}
/**
 * Generate access token and refresh token for a user
 * Access token: Short-lived JWT (15 minutes by default)
 * Refresh token: Long-lived random token stored in DB (7 days)
 */
export declare const generateTokens: (user: User) => Promise<Tokens>;
/**
 * Verify and validate a refresh token
 * Returns the associated user if valid, null otherwise
 */
export declare const verifyRefreshToken: (token: string) => Promise<User | null>;
/**
 * Revoke (delete) a specific refresh token
 * Used for logout
 */
export declare const revokeRefreshToken: (token: string) => Promise<boolean>;
/**
 * Revoke all refresh tokens for a user
 * Used for "logout from all devices"
 */
export declare const revokeAllUserTokens: (userId: string) => Promise<boolean>;
/**
 * Clean up expired refresh tokens
 * Should be run periodically (cron job)
 */
export declare const cleanupExpiredTokens: () => Promise<number>;
/**
 * Generate access token (JWT) for a user
 */
export declare const generateAccessToken: (userId: string) => string;
/**
 * Generate refresh token (random string) for a user
 */
export declare const generateRefreshToken: (userId: string) => string;
export {};
//# sourceMappingURL=tokenUtils.d.ts.map