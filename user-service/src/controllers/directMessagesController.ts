import { Request, Response } from 'express';
import prisma from '../config/database.js';
import { logger, logError } from '../utils/logger.js';

/**
 * Get direct message conversation between two users
 */
export const getDirectMessages = async (req: Request, res: Response) => {
    try {
        const currentUserId = req.user?.userId;
        const { otherUserId } = req.params;

        if (!currentUserId) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }

        if (!otherUserId) {
            return res.status(400).json({ 
                message: 'Other user ID is required' 
            });
        }

        // Parse pagination params (already validated by middleware)
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50; // Higher default for messages
        const skip = (page - 1) * limit;

        // Get total count for pagination metadata
        const totalCount = await prisma.directMessage.count({
            where: {
                OR: [
                    { senderId: currentUserId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: currentUserId }
                ]
            }
        });

        // Get messages between the two users with pagination
        // Note: We fetch in descending order and reverse to show newest at bottom
        const messages = await prisma.directMessage.findMany({
            where: {
                OR: [
                    { senderId: currentUserId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: currentUserId }
                ]
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc' // Get newest first, then reverse
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true
                    }
                }
            }
        });

        // Reverse to show oldest first (chronological order)
        const messagesChronological = messages.reverse();

        // Mark messages as read
        await prisma.directMessage.updateMany({
            where: {
                senderId: otherUserId,
                receiverId: currentUserId,
                isRead: false
            },
            data: {
                isRead: true
            }
        });

        // Get other user info
        const otherUser = await prisma.user.findUnique({
            where: { id: otherUserId },
            select: {
                id: true,
                name: true,
                email: true,
                profileImage: true
            }
        });

        logger.info({
            type: 'DM_MESSAGES_FETCHED',
            userId: currentUserId,
            otherUserId,
            messageCount: messagesChronological.length,
            page,
            totalCount
        });

        const totalPages = Math.ceil(totalCount / limit);

        return res.status(200).json({
            success: true,
            data: {
                messages: messagesChronological,
                otherUser
            },
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
                hasMore: page < totalPages
            }
        });
    } catch (error: any) {
        logError(error, 'Get direct messages error', { userId: req.user?.userId });
        return res.status(500).json({ 
            message: 'Failed to fetch messages'
        });
    }
};

/**
 * Send a direct message
 */
export const sendDirectMessage = async (req: Request, res: Response) => {
    try {
        // Support both authenticated requests and internal service calls
        const currentUserId = req.user?.userId || req.headers['x-user-id'] as string;
        // Request body is already validated by middleware
        const { receiverId, content, attachments = [] } = req.body;

        if (!currentUserId) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }

        const message = await prisma.directMessage.create({
            data: {
                senderId: currentUserId,
                receiverId: receiverId,
                content: content?.trim() || '',
                attachments: attachments,
                isRead: false
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true
                    }
                }
            }
        });

        logger.info({
            type: 'DM_SENT',
            senderId: currentUserId,
            receiverId,
            messageId: message.id,
            hasAttachments: attachments.length > 0
        });

        return res.status(200).json({
            success: true,
            data: message
        });
    } catch (error: any) {
        logError(error, 'Send direct message error', { 
            senderId: req.user?.userId || req.headers['x-user-id'],
            receiverId: req.body.receiverId
        });
        return res.status(500).json({ 
            message: 'Failed to send message'
        });
    }
};

/**
 * Get all DM conversations for current user
 */
export const getConversations = async (req: Request, res: Response) => {
    try {
        const currentUserId = req.user?.userId;

        if (!currentUserId) {
            return res.status(401).json({ 
                message: 'User not authenticated' 
            });
        }

        // Get all unique users who have exchanged messages with current user
        const messages = await prisma.directMessage.findMany({
            where: {
                OR: [
                    { senderId: currentUserId },
                    { receiverId: currentUserId }
                ]
            },
            select: {
                senderId: true,
                receiverId: true
            }
        });

        // Extract unique user IDs
        const userIds = new Set<string>();
        messages.forEach(msg => {
            if (msg.senderId !== currentUserId) userIds.add(msg.senderId);
            if (msg.receiverId !== currentUserId) userIds.add(msg.receiverId);
        });

        // Get user details and conversation info for each user
        const conversations = await Promise.all(
            Array.from(userIds).map(async (otherUserId) => {
                const otherUser = await prisma.user.findUnique({
                    where: { id: otherUserId },
                    select: {
                        id: true,
                        name: true,
                        profileImage: true
                    }
                });

                const lastMessage = await prisma.directMessage.findFirst({
                    where: {
                        OR: [
                            { senderId: currentUserId, receiverId: otherUserId },
                            { senderId: otherUserId, receiverId: currentUserId }
                        ]
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                });

                const unreadCount = await prisma.directMessage.count({
                    where: {
                        senderId: otherUserId,
                        receiverId: currentUserId,
                        isRead: false
                    }
                });

                return {
                    friend: otherUser,
                    lastMessage,
                    unreadCount
                };
            })
        );

        // Sort by last message time
        conversations.sort((a, b) => {
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return new Date(b.lastMessage.createdAt).getTime() - 
                   new Date(a.lastMessage.createdAt).getTime();
        });

        return res.status(200).json({
            success: true,
            data: conversations
        });
    } catch (error: any) {
        logError(error, 'Get conversations error', { userId: req.user?.userId });
        return res.status(500).json({ 
            message: 'Failed to fetch conversations'
        });
    }
};
