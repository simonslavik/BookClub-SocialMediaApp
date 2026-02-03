import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient, MembershipStatus } from '@prisma/client';
import { verifyWebSocketToken } from '../utils/websocketAuth.js';
import { 
  Client, 
  activeBookClubs, 
  activeDMClients, 
  broadcastToBookClub 
} from './types.js';

const prisma = new PrismaClient();

export const handleJoin = (
  ws: WebSocket,
  message: any,
  setCurrentClient: (client: Client) => void
) => {
  const { bookClubId, userId, username, roomId, token } = message;
  
  // Verify JWT token
  const verification = verifyWebSocketToken(token);
  if (!verification.valid) {
    console.error('❌ WebSocket auth failed:', verification.error);
    ws.send(JSON.stringify({
      type: 'auth-error',
      message: verification.error,
      shouldReconnect: verification.error?.includes('expired')
    }));
    ws.close();
    return;
  }

  // Verify userId matches token
  if (verification.userId !== userId) {
    console.error('❌ User ID mismatch');
    ws.send(JSON.stringify({
      type: 'auth-error',
      message: 'User ID does not match token',
      shouldReconnect: false
    }));
    ws.close();
    return;
  }

  console.log('✅ WebSocket authenticated:', verification.userId);
  
  // Check if bookclub exists in database
  prisma.bookClub.findUnique({ 
    where: { id: bookClubId },
    include: { rooms: { orderBy: { createdAt: 'asc' } } }
  })
    .then(async (bookClub) => {
      if (!bookClub) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Book club not found'
        }));
        ws.close();
        return;
      }

      // ===== MEMBERSHIP VERIFICATION =====
      // Check if user is an active member of this bookclub
      const membership = await prisma.bookClubMember.findUnique({
        where: {
          bookClubId_userId: {
            bookClubId: bookClubId,
            userId: userId
          }
        }
      });

      if (!membership || membership.status !== MembershipStatus.ACTIVE) {
        console.error('❌ Access denied: User is not an active member');
        ws.send(JSON.stringify({
          type: 'access-denied',
          message: 'You must be a member to access this book club',
          shouldReconnect: false
        }));
        ws.close();
        return;
      }

      if (membership.status === MembershipStatus.BANNED) {
        console.error('❌ Access denied: User is banned');
        ws.send(JSON.stringify({
          type: 'access-denied',
          message: 'You have been banned from this book club',
          shouldReconnect: false
        }));
        ws.close();
        return;
      }

      console.log('✅ Membership verified:', { userId, bookClubId, role: membership.role });

      // If no roomId provided, use first room (general)
      const targetRoomId = roomId || bookClub.rooms[0]?.id;
      
      if (!targetRoomId) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'No rooms available in this book club'
        }));
        ws.close();
        return;
      }

      // Create client
      const clientId = uuidv4();
      const currentClient: Client = {
        id: clientId,
        userId: userId,
        username: username || 'Anonymous',
        ws,
        bookClubId,
        roomId: targetRoomId
      };
      setCurrentClient(currentClient);

      // Get or create active bookclub
      if (!activeBookClubs.has(bookClubId)) {
        activeBookClubs.set(bookClubId, { clients: new Map() });
      }
      const activeClub = activeBookClubs.get(bookClubId)!;
      activeClub.clients.set(clientId, currentClient);

      // Update last active timestamp
      await prisma.bookClub.update({
        where: { id: bookClubId },
        data: { lastActiveAt: new Date() }
      });

      // Get recent messages for the current room
      const recentMessages = await prisma.message.findMany({
        where: { roomId: targetRoomId },
        orderBy: { createdAt: 'asc' },
        take: 100,
        include: {
          attachments: true
        }
      });

      // Fetch all active member details from user service
      const activeMembers = await prisma.bookClubMember.findMany({
        where: {
          bookClubId: bookClubId,
          status: MembershipStatus.ACTIVE
        },
        select: { userId: true }
      });

      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001/api';
      let memberDetails = [];
      const memberIds = activeMembers.map(m => m.userId);
      
      try {
        const response = await fetch(`${userServiceUrl}/users/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: memberIds })
        });
        
        if (response.ok) {
          const data: any = await response.json();
          memberDetails = data.users || [];
        } else {
          console.error('Failed to fetch member details:', response.status);
        }
      } catch (error) {
        console.error('Error fetching member details:', error);
      }

      // Send initial data to new user
      ws.send(JSON.stringify({
        type: 'init',
        clientId,
        bookClub,
        currentRoomId: targetRoomId,
        messages: recentMessages,
        members: memberDetails,
        users: Array.from(activeClub.clients.values()).map(c => ({
          id: c.id,
          userId: c.userId,
          username: c.username,
          roomId: c.roomId
        }))
      }));

      // Notify others that someone joined (including updated members if new)
      if (wasNewMember) {
        broadcastToBookClub(activeClub, {
          type: 'user-joined',
          user: {
            id: clientId,
            userId: currentClient.userId,
            username: currentClient.username,
            roomId: currentClient.roomId
          },
          members: memberDetails
        }, clientId);
      } else {
        broadcastToBookClub(activeClub, {
          type: 'user-joined',
          user: {
            id: clientId,
            userId: currentClient.userId,
            username: currentClient.username,
            roomId: currentClient.roomId
          }
        }, clientId);
      }

      console.log(`👥 ${username} joined book club ${bookClubId} in room ${targetRoomId} (${activeClub.clients.size} users)`);
    })
    .catch((error) => {
      console.error('Error joining book club:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Failed to join book club' }));
      ws.close();
    });
};

export const handleSwitchRoom = (message: any, currentClient: Client | null) => {
  if (!currentClient) return;

  const { roomId } = message;
  
  // Verify room belongs to the bookclub
  prisma.room.findUnique({ where: { id: roomId } })
    .then(async (room) => {
      if (!room || room.bookClubId !== currentClient.bookClubId) {
        currentClient.ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid room'
        }));
        return;
      }

      // Update client's current room
      currentClient.roomId = roomId;

      // Get messages for the new room
      const messages = await prisma.message.findMany({
        where: { roomId },
        orderBy: { createdAt: 'asc' },
        take: 100,
        include: {
          attachments: true
        }
      });

      // Send room data to user
      currentClient.ws.send(JSON.stringify({
        type: 'room-switched',
        roomId,
        messages
      }));

      console.log(`🔄 ${currentClient.username} switched to room ${roomId}`);
    })
    .catch((error) => {
      console.error('Error switching room:', error);
      if (currentClient && currentClient.ws.readyState === WebSocket.OPEN) {
        currentClient.ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to switch room'
        }));
      }
    });
};

export const handleChatMessage = (message: any, currentClient: Client | null) => {
  if (!currentClient || !currentClient.roomId) return;

  const activeClub = activeBookClubs.get(currentClient.bookClubId!);
  if (!activeClub) return;

  // Save message to database
  prisma.message.create({
    data: {
      roomId: currentClient.roomId,
      userId: currentClient.userId,
      username: currentClient.username,
      content: message.message || null,
      attachments: message.attachments && message.attachments.length > 0 ? {
        connect: message.attachments.map((att: any) => ({ id: att.id }))
      } : undefined
    },
    include: {
      attachments: true
    }
  })
  .then((savedMessage) => {
    // Broadcast chat message to all users in the SAME ROOM (including sender)
    const chatData = {
      type: 'chat-message',
      message: savedMessage
    };

    activeClub.clients.forEach((client) => {
      if (client.roomId === currentClient.roomId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(chatData));
      }
    });

    const attachmentInfo = savedMessage.attachments?.length > 0 
      ? ` with ${savedMessage.attachments.length} attachment(s)` 
      : '';
    console.log(`💬 ${currentClient.username} in room ${currentClient.roomId}: ${message.message || '[files only]'}${attachmentInfo}`);
  })
  .catch((error) => {
    console.error('Error saving message:', error);
    if (currentClient && currentClient.ws.readyState === WebSocket.OPEN) {
      currentClient.ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to send message'
      }));
    }
  });
};

export const handleJoinDM = (
  ws: WebSocket,
  message: any,
  setCurrentClient: (client: Client) => void
) => {
  const { userId, username, token } = message;
  
  // Verify JWT token
  const verification = verifyWebSocketToken(token);
  if (!verification.valid) {
    console.error('❌ DM WebSocket auth failed:', verification.error);
    ws.send(JSON.stringify({
      type: 'auth-error',
      message: verification.error,
      shouldReconnect: verification.error?.includes('expired')
    }));
    ws.close();
    return;
  }

  // Verify userId matches token
  if (verification.userId !== userId) {
    console.error('❌ DM User ID mismatch');
    ws.send(JSON.stringify({
      type: 'auth-error',
      message: 'User ID does not match token',
      shouldReconnect: false
    }));
    ws.close();
    return;
  }

  console.log('✅ DM WebSocket authenticated:', verification.userId);
  
  // Create DM client
  const clientId = uuidv4();
  const currentClient: Client = {
    id: clientId,
    userId,
    username,
    ws,
    isDMConnection: true
  };
  setCurrentClient(currentClient);
  
  // Store in active DM clients (one per user)
  activeDMClients.set(userId, currentClient);
  
  ws.send(JSON.stringify({
    type: 'dm-joined',
    userId
  }));
  
  console.log(`📨 ${username} (${userId}) joined DM connection`);
};

export const handleDMMessage = async (message: any, currentClient: Client | null) => {
  if (!currentClient || !currentClient.isDMConnection) return;

  const { receiverId, content, attachments = [] } = message;
  
  try {
    // Save message to user-service database via API
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001/api';
    const response = await fetch(`${userServiceUrl}/messages`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': currentClient.userId // Internal service-to-service header
      },
      body: JSON.stringify({ receiverId, content, attachments })
    });

    if (!response.ok) {
      const errorData: any = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Failed to save DM');
    }

    const data: any = await response.json();
    // Handle both response formats: { data: message } or { message }
    const savedMessage = data.data || data.message;

    if (!savedMessage) {
      throw new Error('No message in response');
    }

    // Send confirmation to sender
    if (currentClient.ws.readyState === WebSocket.OPEN) {
      currentClient.ws.send(JSON.stringify({
        type: 'dm-sent',
        message: savedMessage
      }));
    }

    // Send message to receiver if they're online
    const receiverClient = activeDMClients.get(receiverId);
    if (receiverClient && receiverClient.ws.readyState === WebSocket.OPEN) {
      receiverClient.ws.send(JSON.stringify({
        type: 'dm-received',
        message: savedMessage
      }));
    }

    console.log(`📨 DM from ${currentClient.username} to ${receiverId}: ${content}`);
  } catch (error) {
    console.error('Error handling DM:', error);
    if (currentClient && currentClient.ws.readyState === WebSocket.OPEN) {
      currentClient.ws.send(JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to send direct message'
      }));
    }
  }
};

export const handleDisconnect = (client: Client) => {
  // Handle DM disconnection
  if (client.isDMConnection) {
    activeDMClients.delete(client.userId);
    console.log(`📪 ${client.username} (${client.userId}) left DM connection`);
    return;
  }

  // Handle bookclub disconnection
  if (!client.bookClubId) return;
  
  const activeClub = activeBookClubs.get(client.bookClubId);
  if (!activeClub) return;

  activeClub.clients.delete(client.id);

  // Notify others
  broadcastToBookClub(activeClub, {
    type: 'user-left',
    userId: client.id,
    username: client.username
  });

  console.log(`👋 ${client.username} left book club ${client.bookClubId} (${activeClub.clients.size} users remaining)`);

  // Clean up empty active bookclubs (but keep in database!)
  if (activeClub.clients.size === 0) {
    activeBookClubs.delete(client.bookClubId);
    console.log(`🧹 Active book club ${client.bookClubId} cleaned up (no connected users)`);
  }
};
