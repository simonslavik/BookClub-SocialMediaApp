import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { MembershipStatus, BookClubRole } from '@prisma/client';
import { verifyWebSocketToken } from '../utils/websocketAuth.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { 
  Client, 
  activeBookClubs, 
  activeDMClients, 
  broadcastToBookClub 
} from './types.js';

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

      // Profile image will be resolved from the batch user fetch below
      let userProfileImage = message.profileImage || null;

      // Track if this is a new member (for WebSocket purposes, this is always false since they must already be a member)
      const wasNewMember = false;

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
        profileImage: userProfileImage,
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
      console.log('📨 Fetching messages with deletedAt field...');
      const recentMessages = await prisma.message.findMany({
        where: { roomId: targetRoomId },
        orderBy: { createdAt: 'asc' },
        take: 100,
        select: {
          id: true,
          content: true,
          userId: true,
          username: true,
          profileImage: true,
          isPinned: true,
          deletedAt: true,
          deletedBy: true,
          createdAt: true,
          attachments: true
        }
      });
      console.log('📨 Sample message:', recentMessages[0]);

      // Fetch all active member details from user service
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001/api';
      const activeMembers = await prisma.bookClubMember.findMany({
        where: {
          bookClubId: bookClubId,
          status: MembershipStatus.ACTIVE
        },
        select: { userId: true }
      });

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

      // Create a map of userId to user details for quick lookup
      const userDetailsMap = new Map(memberDetails.map((user: any) => [user.id, user]));

      // Resolve current user's profile image from batch results (avoids separate HTTP call)
      const currentUserDetails = userDetailsMap.get(userId);
      if (currentUserDetails?.profileImage) {
        userProfileImage = currentUserDetails.profileImage;
      }

      // Enrich messages with profile images from user details
      const enrichedMessages = recentMessages.map(msg => {
        const userDetails = userDetailsMap.get(msg.userId);
        return {
          ...msg,
          profileImage: msg.profileImage || userDetails?.profileImage || null
        };
      });

      // Send initial data to new user
      const initPayload = {
        type: 'init',
        clientId,
        bookClub,
        currentRoomId: targetRoomId,
        messages: enrichedMessages,
        members: memberDetails,
        users: Array.from(activeClub.clients.values()).map(c => ({
          id: c.id,
          userId: c.userId,
          username: c.username,
          roomId: c.roomId
        }))
      };
      console.log('📤 Sending init with message sample:', initPayload.messages[0]);
      ws.send(JSON.stringify(initPayload));

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
        select: {
          id: true,
          content: true,
          userId: true,
          username: true,
          isPinned: true,
          deletedAt: true,
          deletedBy: true,
          createdAt: true,
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
      profileImage: currentClient.profileImage,
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

export const handleDeleteDMMessage = async (message: any, currentClient: Client | null) => {
  if (!currentClient || !currentClient.isDMConnection) return;

  const { messageId } = message;
  
  try {
    // Note: The actual deletion is handled by the HTTP DELETE endpoint
    // This handler just broadcasts the deletion to the conversation partner
    
    const { receiverId } = message;

    // Only notify the specific conversation partner (not all DM clients)
    if (receiverId) {
      const receiverClient = activeDMClients.get(receiverId);
      if (receiverClient && receiverClient.ws.readyState === WebSocket.OPEN) {
        receiverClient.ws.send(JSON.stringify({
          type: 'dm-deleted',
          messageId
        }));
      }
    }

    console.log(`🗑️ DM deletion broadcasted by ${currentClient.username}: ${messageId}`);
  } catch (error) {
    console.error('Error broadcasting DM deletion:', error);
    if (currentClient && currentClient.ws.readyState === WebSocket.OPEN) {
      currentClient.ws.send(JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to broadcast deletion'
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

export const handleDeleteMessage = async (message: any, currentClient: Client | null) => {
  if (!currentClient || !currentClient.bookClubId) return;

  const { messageId } = message;
  const activeClub = activeBookClubs.get(currentClient.bookClubId);
  if (!activeClub) return;

  try {
    // Parallelize message fetch and membership check (was sequential)
    const isOwnMessage = (msg: any) => msg.userId === currentClient.userId;

    const [messageToDelete, membership] = await Promise.all([
      prisma.message.findUnique({
        where: { id: messageId },
        include: { room: true }
      }),
      // Only fetch membership if we might need it for role check
      prisma.bookClubMember.findUnique({
        where: {
          bookClubId_userId: {
            bookClubId: currentClient.bookClubId,
            userId: currentClient.userId
          }
        }
      })
    ]);

    if (!messageToDelete) {
      currentClient.ws.send(JSON.stringify({
        type: 'error',
        message: 'Message not found'
      }));
      return;
    }

    // Check if user has MODERATOR+ permission or owns the message
    let hasPermission = isOwnMessage(messageToDelete);

    if (!hasPermission) {
      const roleHierarchy = {
        [BookClubRole.OWNER]: 4,
        [BookClubRole.ADMIN]: 3,
        [BookClubRole.MODERATOR]: 2,
        [BookClubRole.MEMBER]: 1
      };

      hasPermission = membership ? roleHierarchy[membership.role] >= roleHierarchy[BookClubRole.MODERATOR] : false;
    }

    if (!hasPermission) {
      currentClient.ws.send(JSON.stringify({
        type: 'error',
        message: 'You need MODERATOR role or higher to delete other users\' messages'
      }));
      return;
    }

    // Soft delete the message and unpin if pinned
    const deletedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
        deletedBy: currentClient.userId,
        content: '[Message deleted]',
        isPinned: false
      }
    });

    // Broadcast deletion to all users in the room
    broadcastToBookClub(activeClub, {
      type: 'message-deleted',
      messageId,
      deletedBy: currentClient.userId
    });

    console.log(`🗑️ Message ${messageId} deleted by ${currentClient.username}`);
  } catch (error) {
    console.error('Error deleting message:', error);
    currentClient.ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to delete message'
    }));
  }
};

export const handlePinMessage = async (message: any, currentClient: Client | null) => {
  if (!currentClient || !currentClient.bookClubId) return;

  const { messageId, isPinned } = message;
  const activeClub = activeBookClubs.get(currentClient.bookClubId);
  if (!activeClub) return;

  try {
    // Fetch membership and verify message exists in parallel
    const [membership, messageExists] = await Promise.all([
      prisma.bookClubMember.findUnique({
        where: {
          bookClubId_userId: {
            bookClubId: currentClient.bookClubId,
            userId: currentClient.userId
          }
        }
      }),
      prisma.message.findUnique({ where: { id: messageId }, select: { id: true } })
    ]);

    const roleHierarchy = {
      [BookClubRole.OWNER]: 4,
      [BookClubRole.ADMIN]: 3,
      [BookClubRole.MODERATOR]: 2,
      [BookClubRole.MEMBER]: 1
    };

    const hasPermission = membership ? roleHierarchy[membership.role] >= roleHierarchy[BookClubRole.MODERATOR] : false;

    if (!hasPermission) {
      currentClient.ws.send(JSON.stringify({
        type: 'error',
        message: 'You need MODERATOR role or higher to pin messages'
      }));
      return;
    }

    if (!messageExists) {
      currentClient.ws.send(JSON.stringify({
        type: 'error',
        message: 'Message not found'
      }));
      return;
    }

    // Update message pin status
    const pinnedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { isPinned }
    });

    // Broadcast pin status to all users in the room
    broadcastToBookClub(activeClub, {
      type: 'message-pinned',
      messageId,
      isPinned,
      pinnedBy: currentClient.userId
    });

    console.log(`📌 Message ${messageId} ${isPinned ? 'pinned' : 'unpinned'} by ${currentClient.username}`);
  } catch (error) {
    console.error('Error pinning message:', error);
    currentClient.ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to pin message'
    }));
  }
};
