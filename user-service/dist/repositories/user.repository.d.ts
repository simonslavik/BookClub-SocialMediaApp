/**
 * Repository layer for User database operations
 */
export declare class UserRepository {
    /**
     * Find user by ID
     */
    static findById(userId: string, includePublicOnly?: boolean): Promise<{
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
    } | null>;
    /**
     * Find user by email
     */
    static findByEmail(email: string): Promise<{
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
    } | null>;
    /**
     * Find user by Google ID
     */
    static findByGoogleId(googleId: string): Promise<{
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
    } | null>;
    /**
     * Find user by email verification token
     */
    static findByEmailVerificationToken(token: string): Promise<{
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
    } | null>;
    /**
     * Find user by password reset token
     */
    static findByPasswordResetToken(token: string): Promise<{
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
    } | null>;
    /**
     * Create new user
     */
    static create(data: {
        name: string;
        email: string;
        password?: string;
        googleId?: string;
        authProvider?: string;
        emailVerified?: boolean;
        profileImage?: string | null;
    }): Promise<{
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        profileImage: string | null;
    }>;
    /**
     * Update user
     */
    static update(userId: string, data: any): Promise<{
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        profileImage: string | null;
    }>;
    /**
     * Update user password
     */
    static updatePassword(userId: string, hashedPassword: string): Promise<{
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
    }>;
    /**
     * Set email verification token
     */
    static setEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<{
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
    }>;
    /**
     * Verify email
     */
    static verifyEmail(userId: string): Promise<{
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
    }>;
    /**
     * Set password reset token
     */
    static setPasswordResetToken(userId: string, hashedToken: string, expiresAt: Date): Promise<{
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
    }>;
    /**
     * Clear password reset token
     */
    static clearPasswordResetToken(userId: string): Promise<{
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
    }>;
    /**
     * Delete user
     */
    static delete(userId: string): Promise<{
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
    }>;
    /**
     * Search users by name or email
     */
    static search(query: string, limit?: number): Promise<{
        id: string;
        email: string;
        name: string;
        profileImage: string | null;
    }[]>;
    /**
     * Get multiple users by IDs
     */
    static findManyByIds(userIds: string[]): Promise<{
        id: string;
        email: string;
        name: string;
        profileImage: string | null;
    }[]>;
}
//# sourceMappingURL=user.repository.d.ts.map