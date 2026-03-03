/**
 * Service layer for user profile operations
 */
export declare class UserService {
    /**
     * Get user profile
     */
    static getProfile(userId: string): Promise<{
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
     * Update user profile
     */
    static updateProfile(userId: string, data: {
        name?: string;
        profileImage?: string;
    }): Promise<{
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        profileImage: string | null;
    }>;
    /**
     * Update profile image
     */
    static updateProfileImage(userId: string, imageUrl: string): Promise<{
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        profileImage: string | null;
    }>;
    /**
     * Delete profile image
     */
    static deleteProfileImage(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        profileImage: string | null;
    }>;
    /**
     * Search users
     */
    static searchUsers(query: string, limit?: number): Promise<{
        id: string;
        email: string;
        name: string;
        profileImage: string | null;
    }[]>;
    /**
     * Get multiple users by IDs
     */
    static getUsersByIds(userIds: string[]): Promise<{
        id: string;
        email: string;
        name: string;
        profileImage: string | null;
    }[]>;
    /**
     * Delete user account
     */
    static deleteAccount(userId: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=user.service.d.ts.map