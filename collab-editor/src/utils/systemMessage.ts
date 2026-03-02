import { WebSocket } from 'ws';
import prisma from '../config/database.js';
import { activeBookClubs } from '../websocket/types.js';
import logger from './logger.js';

/**
 * Fetch a username from user-service by userId.
 */
async function fetchUsername(userId: string): Promise<string> {
  try {
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001/api';
    const response = await fetch(`${userServiceUrl}/users/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: [userId] })
    });
    if (response.ok) {
      const data: any = await response.json();
      const user = data.users?.[0];
      if (user?.username) return user.username;
    }
  } catch (error) {
    logger.error('Error fetching username for system message', { error, userId });
  }
  return 'Someone';
}

/**
 * Create a system message in the general (default) room of a bookclub
 * and broadcast it to all connected WebSocket clients in that room.
 */
export async function createSystemMessage(
  bookClubId: string,
  content: string,
  userId: string,
  username?: string
) {
  try {
    // Resolve username if not provided
    const resolvedUsername = username || await fetchUsername(userId);

    // Find the default (general) room for this bookclub
    const generalRoom = await prisma.room.findFirst({
      where: {
        bookClubId,
        isDefault: true
      }
    });

    if (!generalRoom) {
      // Fallback: use the first room ordered by creation
      const firstRoom = await prisma.room.findFirst({
        where: { bookClubId },
        orderBy: { createdAt: 'asc' }
      });
      if (!firstRoom) {
        logger.warn('No room found for system message', { bookClubId });
        return null;
      }
      return await saveAndBroadcast(firstRoom.id, bookClubId, content, userId, resolvedUsername);
    }

    return await saveAndBroadcast(generalRoom.id, bookClubId, content, userId, resolvedUsername);
  } catch (error) {
    logger.error('Error creating system message', { error, bookClubId, content });
    return null;
  }
}

async function saveAndBroadcast(
  roomId: string,
  bookClubId: string,
  content: string,
  userId: string,
  username: string
) {
  // Save system message to database
  const savedMessage = await prisma.message.create({
    data: {
      roomId,
      userId,
      username,
      content,
      isSystem: true
    }
  });

  // Broadcast to all connected clients in the same bookclub who are in this room
  const activeClub = activeBookClubs.get(bookClubId);
  if (activeClub) {
    const chatData = JSON.stringify({
      type: 'chat-message',
      message: {
        ...savedMessage,
        reactions: [],
        attachments: []
      },
      mentions: [],
      mentionsEveryone: false
    });

    activeClub.clients.forEach((client) => {
      if (client.roomId === roomId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(chatData);
      }
    });

    // Also send room-activity to clients in other rooms
    const activityData = JSON.stringify({
      type: 'room-activity',
      roomId
    });

    activeClub.clients.forEach((client) => {
      if (client.roomId !== roomId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(activityData);
      }
    });
  }

  logger.info('SYSTEM_MESSAGE_CREATED', { roomId, bookClubId, content });

  return savedMessage;
}
