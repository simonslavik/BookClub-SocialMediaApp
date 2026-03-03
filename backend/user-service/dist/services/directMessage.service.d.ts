/**
 * Service layer for direct message operations
 */
export declare class DirectMessageService {
    /**
     * Send a direct message
     */
    static sendMessage(senderId: string, receiverId: string, content: string, attachments?: any[]): Promise<{
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
     * Get conversation between two users
     */
    static getConversation(userId: string, partnerId: string, limit?: number, offset?: number): Promise<({
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
    static markMessageAsRead(userId: string, messageId: string): Promise<{
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
     * Get unread count from a specific user
     */
    static getUnreadCount(userId: string, partnerId: string): Promise<number>;
    /**
     * Get total unread count
     */
    static getTotalUnreadCount(userId: string): Promise<number>;
    /**
     * Delete a message
     */
    static deleteMessage(userId: string, messageId: string): Promise<{
        message: string;
    }>;
    /**
     * Delete entire conversation
     */
    static deleteConversation(userId: string, partnerId: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=directMessage.service.d.ts.map