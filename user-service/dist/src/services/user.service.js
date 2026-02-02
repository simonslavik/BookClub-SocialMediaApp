import { UserRepository } from '../repositories/user.repository.js';
import { logger } from '../utils/logger.js';
/**
 * Service layer for user profile operations
 */
export class UserService {
    /**
     * Get user profile
     */
    static async getProfile(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }
        return user;
    }
    /**
     * Update user profile
     */
    static async updateProfile(userId, data) {
        const updatedUser = await UserRepository.update(userId, data);
        logger.info({
            type: 'PROFILE_UPDATED',
            userId,
            updatedFields: Object.keys(data),
        });
        return updatedUser;
    }
    /**
     * Update profile image
     */
    static async updateProfileImage(userId, imageUrl) {
        const updatedUser = await UserRepository.update(userId, {
            profileImage: imageUrl,
        });
        logger.info({
            type: 'PROFILE_IMAGE_UPDATED',
            userId,
            imageUrl,
        });
        return updatedUser;
    }
    /**
     * Delete profile image
     */
    static async deleteProfileImage(userId) {
        const updatedUser = await UserRepository.update(userId, {
            profileImage: null,
        });
        logger.info({
            type: 'PROFILE_IMAGE_DELETED',
            userId,
        });
        return updatedUser;
    }
    /**
     * Search users
     */
    static async searchUsers(query, limit = 10) {
        return await UserRepository.search(query, limit);
    }
    /**
     * Get multiple users by IDs
     */
    static async getUsersByIds(userIds) {
        return await UserRepository.findManyByIds(userIds);
    }
    /**
     * Delete user account
     */
    static async deleteAccount(userId) {
        await UserRepository.delete(userId);
        logger.info({
            type: 'ACCOUNT_DELETED',
            userId,
        });
        return { message: 'Account deleted successfully' };
    }
}
//# sourceMappingURL=user.service.js.map