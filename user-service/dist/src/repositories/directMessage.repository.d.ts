/**
 * Repository layer for DirectMessage database operations
 */
export declare class DirectMessageRepository {
    /**
     * Create a direct message
     */
    static create(senderId: string, receiverId: string, content: string, attachments?: any[]): Promise<{
        sender: {
            id: string;
            email: string;
            name: string;
            profileImage: string | null;
        };
        receiver: {
            id: string;
            email: string;
            name: string;
            profileImage: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        senderId: string;
        content: string;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        receiverId: string;
    }>;
    /**
     * Find message by ID
     */
    static findById(messageId: string): Promise<({
        sender: {
            id: string;
            email: string;
            name: string;
            profileImage: string | null;
        };
        receiver: {
            id: string;
            email: string;
            name: string;
            profileImage: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        senderId: string;
        content: string;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        receiverId: string;
    }) | null>;
    /**
     * Get conversation between two users
     */
    static getConversation(userId1: string, userId2: string, limit?: number, offset?: number): Promise<({
        sender: {
            id: string;
            email: string;
            name: string;
            profileImage: string | null;
        };
        receiver: {
            id: string;
            email: string;
            name: string;
            profileImage: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        senderId: string;
        content: string;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        receiverId: string;
    })[]>;
    /**
     * Get all conversations for a user
     */
    static getUserConversations(userId: string): Promise<{
        partnerId: string;
        lastMessage: ({
            sender: {
                id: string;
                email: string;
                name: string;
                profileImage: string | null;
            };
            receiver: {
                id: string;
                email: string;
                name: string;
                profileImage: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            senderId: string;
            content: string;
            attachments: import("@prisma/client/runtime/library").JsonValue | null;
            isRead: boolean;
            receiverId: string;
        }) | null;
        unreadCount: number;
    }[]>;
    /**
     * Mark message as read
     */
    static markAsRead(messageId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        senderId: string;
        content: string;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        receiverId: string;
    }>;
    /**
     * Mark all messages in conversation as read
     */
    static markConversationAsRead(userId: string, partnerId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    /**
     * Get unread message count from a specific user
     */
    static getUnreadCount(receiverId: string, senderId: string): Promise<number>;
    /**
     * Get total unread count for user
     */
    static getTotalUnreadCount(userId: string): Promise<number>;
    /**
     * Delete message
     */
    static delete(messageId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        senderId: string;
        content: string;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
        receiverId: string;
    }>;
    /**
     * Delete conversation
     */
    static deleteConversation(userId: string, partnerId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
//# sourceMappingURL=directMessage.repository.d.ts.map