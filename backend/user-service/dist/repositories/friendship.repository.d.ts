import { FriendshipStatus } from '@prisma/client';
/**
 * Repository layer for Friendship database operations
 */
export declare class FriendshipRepository {
    /**
     * Find friendship by user IDs
     */
    static findByUserIds(userId: string, friendId: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        friendId: string;
        status: import("@prisma/client").$Enums.FriendshipStatus;
    } | null>;
    /**
     * Find friendship by ID
     */
    static findById(friendshipId: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        friendId: string;
        status: import("@prisma/client").$Enums.FriendshipStatus;
    } | null>;
    /**
     * Create friendship request
     */
    static create(userId: string, friendId: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        friendId: string;
        status: import("@prisma/client").$Enums.FriendshipStatus;
    }>;
    /**
     * Update friendship status
     */
    static updateStatus(friendshipId: string, status: FriendshipStatus): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        friendId: string;
        status: import("@prisma/client").$Enums.FriendshipStatus;
    }>;
    /**
     * Delete friendship
     */
    static delete(friendshipId: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        friendId: string;
        status: import("@prisma/client").$Enums.FriendshipStatus;
    }>;
    /**
     * Get all user friendships with status
     */
    static findAllByUserId(userId: string, status?: FriendshipStatus): Promise<({
        user: {
            id: string;
            email: string;
            name: string;
            profileImage: string | null;
        };
        friend: {
            id: string;
            email: string;
            name: string;
            profileImage: string | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        friendId: string;
        status: import("@prisma/client").$Enums.FriendshipStatus;
    })[]>;
    /**
     * Get pending friend requests received by user
     */
    static getPendingRequests(userId: string): Promise<({
        user: {
            id: string;
            email: string;
            name: string;
            profileImage: string | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        friendId: string;
        status: import("@prisma/client").$Enums.FriendshipStatus;
    })[]>;
    /**
     * Get pending friend requests sent by user
     */
    static getSentRequests(userId: string): Promise<({
        friend: {
            id: string;
            email: string;
            name: string;
            profileImage: string | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        friendId: string;
        status: import("@prisma/client").$Enums.FriendshipStatus;
    })[]>;
    /**
     * Get accepted friends
     */
    static getAcceptedFriends(userId: string): Promise<({
        user: {
            id: string;
            email: string;
            name: string;
            profileImage: string | null;
        };
        friend: {
            id: string;
            email: string;
            name: string;
            profileImage: string | null;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        friendId: string;
        status: import("@prisma/client").$Enums.FriendshipStatus;
    })[]>;
    /**
     * Check if users are friends
     */
    static areFriends(userId: string, friendId: string): Promise<boolean>;
}
//# sourceMappingURL=friendship.repository.d.ts.map