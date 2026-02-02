/**
 * Service layer for friendship operations
 */
export declare class FriendshipService {
    /**
     * Send friend request
     */
    static sendFriendRequest(userId: string, friendId: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        friendId: string;
        status: import("@prisma/client").$Enums.FriendshipStatus;
    } | {
        message: string;
        friendship: {
            userId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            friendId: string;
            status: import("@prisma/client").$Enums.FriendshipStatus;
        };
    }>;
    /**
     * Accept friend request
     */
    static acceptFriendRequest(userId: string, friendshipId: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        friendId: string;
        status: import("@prisma/client").$Enums.FriendshipStatus;
    }>;
    /**
     * Reject friend request
     */
    static rejectFriendRequest(userId: string, friendshipId: string): Promise<{
        message: string;
    }>;
    /**
     * Remove friend (by friendId, not friendshipId)
     */
    static removeFriend(userId: string, friendId: string): Promise<{
        message: string;
    }>;
    /**
     * Block user
     */
    static blockUser(userId: string, friendshipId: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        friendId: string;
        status: import("@prisma/client").$Enums.FriendshipStatus;
    }>;
    /**
     * Get all friends with pagination
     */
    static getFriends(userId: string, page?: number, limit?: number): Promise<{
        friends: {
            friendshipId: string;
            friend: {
                id: string;
                email: string;
                name: string;
                profileImage: string | null;
            };
            since: Date;
        }[];
        totalCount: number;
    }>;
    /**
     * Get pending friend requests received with pagination
     */
    static getPendingRequests(userId: string, page?: number, limit?: number): Promise<{
        requests: {
            friendshipId: string;
            from: {
                id: string;
                email: string;
                name: string;
                profileImage: string | null;
            };
            createdAt: Date;
        }[];
        totalCount: number;
    }>;
    /**
     * Get pending friend requests sent
     */
    static getSentRequests(userId: string): Promise<{
        friendshipId: string;
        to: {
            id: string;
            email: string;
            name: string;
            profileImage: string | null;
        };
        createdAt: Date;
    }[]>;
    /**
     * Check if users are friends
     */
    static areFriends(userId: string, friendId: string): Promise<boolean>;
}
//# sourceMappingURL=friendship.service.d.ts.map