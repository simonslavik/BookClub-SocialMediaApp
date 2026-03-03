/**
 * Service layer for authentication operations
 */
export declare class AuthService {
    /**
     * Register a new user
     */
    static register(name: string, email: string, password: string): Promise<{
        user: {
            emailVerified: boolean;
            id: string;
            email: string;
            name: string;
            createdAt: Date;
            profileImage: string | null;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    /**
     * Login user with email and password
     */
    static login(email: string, password: string): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            profileImage: string | null;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    /**
     * Logout user (revoke refresh token)
     */
    static logout(refreshToken: string): Promise<void>;
    /**
     * Logout from all devices
     */
    static logoutAll(userId: string): Promise<void>;
    /**
     * Request password reset
     */
    static requestPasswordReset(email: string): Promise<{
        resetToken: null;
        expiresAt?: undefined;
    } | {
        resetToken: string;
        expiresAt: Date;
    }>;
    /**
     * Reset password with token
     */
    static resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    /**
     * Send email verification
     * If userId is null, find user by email (for resend)
     */
    static sendEmailVerification(userId: string | null, email: string): Promise<string>;
    /**
     * Verify email with token
     */
    static verifyEmail(token: string): Promise<{
        message: string;
    }>;
    /**
     * Change password for authenticated user
     */
    static changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map