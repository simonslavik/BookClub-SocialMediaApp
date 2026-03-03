import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { MembershipStatus, BookClubRole, RoomType } from '@prisma/client';
import { verifyWebSocketToken } from '../utils/websocketAuth.js';
import { hasMinRole } from '../utils/roles.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { 
  Client, 
  activeBookClubs, 
  activeDMClients, 
  broadcastToBookClub 
} from './types.js';
import { getReactionsForMessages } from './reactionHandler.js';
import { extractMentions, isEveryoneMentioned } from '../utils/mentionParser.js';
import { RoomService } from '../services/room.service.js';

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
    include: { rooms: { orderBy: { createdAt: 'asc' }, include: { _count: { select: { members: true } } } } }
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

      // Return ALL rooms (including private ones) — access control is enforced on switch-room
      const canSeeAll = hasMinRole(membership.role, BookClubRole.MODERATOR);
      const visibleRooms = [...bookClub.rooms];

      // For non-moderator users, determine private room membership for isMember flag
      let memberRoomIds = new Set<string>();
      if (!canSeeAll) {
        const privateRooms = bookClub.rooms.filter((room: any) => room.type === RoomType.PRIVATE);
        if (privateRooms.length > 0) {
          const privateRoomMemberships = await prisma.roomMember.findMany({
            where: {
              userId,
              roomId: { in: privateRooms.map((r: any) => r.id) }
            },
            select: { roomId: true }
          });
          memberRoomIds = new Set(privateRoomMemberships.map(m => m.roomId));
        }
      }

      // Sort visible rooms by createdAt
      visibleRooms.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // If no roomId provided, use first accessible room (general)
      // Skip private rooms the user isn't a member of
      const accessibleRooms = visibleRooms.filter((r: any) => 
        r.type !== RoomType.PRIVATE || canSeeAll || memberRoomIds.has(r.id)
      );
      const targetRoomId = roomId || accessibleRooms[0]?.id;
      
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
          isSystem: true,
          isPinned: true,
          deletedAt: true,
          deletedBy: true,
          editedAt: true,
          replyToId: true,
          replyTo: {
            select: {
              id: true,
              content: true,
              username: true,
              userId: true
            }
          },
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
        select: { userId: true },
        take: 200
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
      const messageIds = recentMessages.map(msg => msg.id);
      const reactionsMap = await getReactionsForMessages(messageIds);

      const enrichedMessages = recentMessages.map(msg => {
        const userDetails = userDetailsMap.get(msg.userId);
        return {
          ...msg,
          profileImage: msg.profileImage || userDetails?.profileImage || null,
          reactions: reactionsMap.get(msg.id) || []
        };
      });

      // Send initial data to new user
      // Get the user's previous lastReadAt for the current room (before updating)
      const currentRoomRead = await prisma.roomRead.findUnique({
        where: { roomId_userId: { roomId: targetRoomId, userId } },
        select: { lastReadAt: true }
      });
      const roomLastReadAt = currentRoomRead?.lastReadAt || null;

      // Mark the current room as read
      await prisma.roomRead.upsert({
        where: { roomId_userId: { roomId: targetRoomId, userId } },
        update: { lastReadAt: new Date() },
        create: { roomId: targetRoomId, userId, lastReadAt: new Date() }
      });

      // Determine which rooms have unread messages
      // Get all accessible room IDs
      const accessibleRoomIds = accessibleRooms.map((r: any) => r.id);

      // Get the user's last read timestamps for all rooms
      const roomReads = await prisma.roomRead.findMany({
        where: { userId, roomId: { in: accessibleRoomIds } },
        select: { roomId: true, lastReadAt: true }
      });
      const readMap = new Map(roomReads.map(rr => [rr.roomId, rr.lastReadAt]));

      // Get the latest message timestamp per room (only from OTHER users)
      const latestMessages = await prisma.message.groupBy({
        by: ['roomId'],
        where: { roomId: { in: accessibleRoomIds }, userId: { not: userId } },
        _max: { createdAt: true }
      });

      const unreadRoomIds: string[] = [];
      for (const lm of latestMessages) {
        const lastMsg = lm._max.createdAt;
        if (!lastMsg) continue;
        const lastRead = readMap.get(lm.roomId);
        // Unread if: never read, or last message is newer than last read, and not the current room
        if (lm.roomId !== targetRoomId && (!lastRead || lastMsg > lastRead)) {
          unreadRoomIds.push(lm.roomId);
        }
      }

      // ── Compute unread navigation sections ──
      const sectionReads = await prisma.sectionRead.findMany({
        where: { userId, clubId: bookClubId },
      });
      const sectionReadMap: Record<string, Date> = {};
      for (const sr of sectionReads) {
        sectionReadMap[sr.section] = sr.lastViewedAt;
      }

      const sectionActivities = await prisma.sectionActivity.findMany({
        where: { clubId: bookClubId },
      });

      const unreadSections: string[] = [];
      for (const sa of sectionActivities) {
        const lastViewed = sectionReadMap[sa.section];
        // Unread if: user never viewed, or activity is newer than last view, and not by the user themselves
        if (sa.lastActivityBy !== userId && (!lastViewed || sa.lastActivityAt > lastViewed)) {
          unreadSections.push(sa.section);
        }
      }

      const initPayload = {
        type: 'init',
        clientId,
        bookClub: {
          ...bookClub,
          rooms: visibleRooms.map((r: any) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            type: r.type,
            isDefault: r.isDefault,
            createdAt: r.createdAt,
            _count: r._count,
            isMember: r.type !== RoomType.PRIVATE || canSeeAll || memberRoomIds.has(r.id)
          }))
        },
        currentRoomId: targetRoomId,
        messages: enrichedMessages,
        hasMore: recentMessages.length === 100,
        members: memberDetails,
        userRole: membership.role,
        unreadRoomIds,
        unreadSections,
        lastReadAt: roomLastReadAt ? roomLastReadAt.toISOString() : null,
        users: Array.from(activeClub.clients.values()).map(c => ({
          id: c.id,
          userId: c.userId,
          username: c.username,
          roomId: c.roomId
        }))
      };
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

      // Check if user can access this room (private rooms need membership or mod+ role)
      const membership = await prisma.bookClubMember.findUnique({
        where: {
          bookClubId_userId: {
            bookClubId: currentClient.bookClubId!,
            userId: currentClient.userId
          }
        }
      });

      const canAccess = await RoomService.canAccessRoom(roomId, currentClient.userId, membership?.role);
      if (!canAccess) {
        currentClient.ws.send(JSON.stringify({
          type: 'error',
          message: 'You do not have access to this room'
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
          profileImage: true,
          isSystem: true,
          isPinned: true,
          deletedAt: true,
          deletedBy: true,
          editedAt: true,
          replyToId: true,
          replyTo: {
            select: {
              id: true,
              content: true,
              username: true,
              userId: true
            }
          },
          createdAt: true,
          attachments: true
        }
      });

      // Attach reactions to messages
      const messageIds = messages.map(msg => msg.id);
      const reactionsMap = await getReactionsForMessages(messageIds);
      const messagesWithReactions = messages.map(msg => ({
        ...msg,
        reactions: reactionsMap.get(msg.id) || []
      }));

      // Get the user's previous lastReadAt for the switched room (before updating)
      const switchedRoomRead = await prisma.roomRead.findUnique({
        where: { roomId_userId: { roomId, userId: currentClient.userId } },
        select: { lastReadAt: true }
      });
      const switchedLastReadAt = switchedRoomRead?.lastReadAt || null;

      // Mark the new room as read
      await prisma.roomRead.upsert({
        where: { roomId_userId: { roomId, userId: currentClient.userId } },
        update: { lastReadAt: new Date() },
        create: { roomId, userId: currentClient.userId, lastReadAt: new Date() }
      });

      // Send room data to user
      currentClient.ws.send(JSON.stringify({
        type: 'room-switched',
        roomId,
        roomType: room.type,
        messages: messagesWithReactions,
        hasMore: messages.length === 100,
        lastReadAt: switchedLastReadAt ? switchedLastReadAt.toISOString() : null
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

  // Check send permission (announcement rooms restrict to mods+, private rooms require membership)
  prisma.bookClubMember.findUnique({
    where: {
      bookClubId_userId: {
        bookClubId: currentClient.bookClubId!,
        userId: currentClient.userId
      }
    }
  })
  .then(async (membership) => {
    const canSend = await RoomService.canSendMessage(currentClient.roomId!, currentClient.userId, membership?.role);
    if (!canSend) {
      currentClient.ws.send(JSON.stringify({
        type: 'error',
        message: 'You do not have permission to send messages in this room'
      }));
      return;
    }

    // Save message to database
    const savedMessage = await prisma.message.create({
      data: {
        roomId: currentClient.roomId,
        userId: currentClient.userId,
        username: currentClient.username,
        profileImage: currentClient.profileImage,
        content: message.message || null,
        replyToId: message.replyToId || null,
        attachments: message.attachments && message.attachments.length > 0 ? {
          connect: message.attachments.map((att: any) => ({ id: att.id }))
        } : undefined
      },
      include: {
        attachments: true,
        replyTo: {
          select: {
            id: true,
            content: true,
            username: true,
            userId: true
          }
        }
      }
    });

    // Extract mentions from message content
    const mentionedUserIds = extractMentions(savedMessage.content || '');
    const mentionsEveryone = isEveryoneMentioned(savedMessage.content || '');

    // Broadcast chat message to all users in the SAME ROOM (including sender)
    const chatData = {
      type: 'chat-message',
      message: { ...savedMessage, reactions: [] },
      mentions: mentionedUserIds,
      mentionsEveryone
    };

    activeClub.clients.forEach((client) => {
      if (client.roomId === currentClient.roomId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(chatData));
      }
    });

    // Notify users in OTHER rooms about new activity (for unread indicators)
    const activityData = {
      type: 'room-activity',
      roomId: currentClient.roomId
    };
    let activityCount = 0;
    activeClub.clients.forEach((client) => {
      // Skip same room, same user (own messages), and closed sockets
      if (client.roomId !== currentClient.roomId && client.userId !== currentClient.userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(activityData));
        activityCount++;
      }
    });
    console.log(`🔔 room-activity sent to ${activityCount} clients in other rooms (total clients: ${activeClub.clients.size})`);

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

export const handleLoadOlderMessages = async (message: any, currentClient: Client | null) => {
  if (!currentClient || !currentClient.roomId) return;

  const { before, limit = 50 } = message;
  if (!before) return;

  try {
    const olderMessages = await prisma.message.findMany({
      where: {
        roomId: currentClient.roomId,
        createdAt: { lt: new Date(before) }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        content: true,
        userId: true,
        username: true,
        profileImage: true,
        isSystem: true,
        isPinned: true,
        deletedAt: true,
        deletedBy: true,
        editedAt: true,
        replyToId: true,
        replyTo: {
          select: {
            id: true,
            content: true,
            username: true,
            userId: true
          }
        },
        createdAt: true,
        attachments: true
      }
    });

    // Reverse to chronological order
    olderMessages.reverse();

    // Attach reactions
    const messageIds = olderMessages.map(msg => msg.id);
    const reactionsMap = await getReactionsForMessages(messageIds);
    const enrichedMessages = olderMessages.map(msg => ({
      ...msg,
      reactions: reactionsMap.get(msg.id) || []
    }));

    currentClient.ws.send(JSON.stringify({
      type: 'older-messages',
      messages: enrichedMessages,
      hasMore: olderMessages.length === limit
    }));
  } catch (error) {
    console.error('Error loading older messages:', error);
    currentClient.ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to load older messages'
    }));
  }
};

export const handleDMMessage = async (message: any, currentClient: Client | null) => {
  if (!currentClient || !currentClient.isDMConnection) return;

  const { receiverId, content, attachments = [], replyToId } = message;
  
  try {
    // Save message to user-service database via API
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001/api';
    const response = await fetch(`${userServiceUrl}/messages`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': currentClient.userId // Internal service-to-service header
      },
      body: JSON.stringify({ receiverId, content, attachments, replyToId })
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
      hasPermission = membership ? hasMinRole(membership.role, BookClubRole.MODERATOR) : false;
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

    // Broadcast deletion to users in the same room only
    activeClub.clients.forEach((client) => {
      if (client.roomId === currentClient.roomId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: 'message-deleted',
          messageId,
          deletedBy: currentClient.userId
        }));
      }
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

    const hasPermission = membership ? hasMinRole(membership.role, BookClubRole.MODERATOR) : false;

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

    // Broadcast pin status to users in the same room only
    activeClub.clients.forEach((client) => {
      if (client.roomId === currentClient.roomId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: 'message-pinned',
          messageId,
          isPinned,
          pinnedBy: currentClient.userId
        }));
      }
    });

    console.log(`Message ${messageId} ${isPinned ? 'pinned' : 'unpinned'} by ${currentClient.username}`);
  } catch (error) {
    console.error('Error pinning message:', error);
    currentClient.ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to pin message'
    }));
  }
};

export const handleEditMessage = async (message: any, currentClient: Client | null) => {
  if (!currentClient || !currentClient.bookClubId) return;

  const { messageId, content } = message;
  const activeClub = activeBookClubs.get(currentClient.bookClubId);
  if (!activeClub) return;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    currentClient.ws.send(JSON.stringify({
      type: 'error',
      message: 'Message content is required'
    }));
    return;
  }

  if (content.length > 4000) {
    currentClient.ws.send(JSON.stringify({
      type: 'error',
      message: 'Message content must be at most 4000 characters'
    }));
    return;
  }

  try {
    const messageToEdit = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!messageToEdit) {
      currentClient.ws.send(JSON.stringify({
        type: 'error',
        message: 'Message not found'
      }));
      return;
    }

    // Only the message author can edit
    if (messageToEdit.userId !== currentClient.userId) {
      currentClient.ws.send(JSON.stringify({
        type: 'error',
        message: 'You can only edit your own messages'
      }));
      return;
    }

    if (messageToEdit.deletedAt) {
      currentClient.ws.send(JSON.stringify({
        type: 'error',
        message: 'Cannot edit a deleted message'
      }));
      return;
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
        editedAt: new Date()
      }
    });

    // Broadcast edit to users in the same room
    activeClub.clients.forEach((client) => {
      if (client.roomId === currentClient.roomId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: 'message-edited',
          messageId,
          content: updatedMessage.content,
          editedAt: updatedMessage.editedAt,
          editedBy: currentClient.userId
        }));
      }
    });

    console.log(`✏️ Message ${messageId} edited by ${currentClient.username}`);
  } catch (error) {
    console.error('Error editing message:', error);
    currentClient.ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to edit message'
    }));
  }
};

// ── DM Reaction handlers ──────────────────────────────────

export const handleDMAddReaction = async (message: any, currentClient: Client | null) => {
  if (!currentClient || !currentClient.isDMConnection) return;

  const { messageId, emoji, receiverId } = message;

  try {
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001/api';
    const response = await fetch(`${userServiceUrl}/messages/${messageId}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': currentClient.userId,
      },
      body: JSON.stringify({ emoji }),
    });

    if (!response.ok) {
      const errorData: any = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Failed to add reaction');
    }

    const data: any = await response.json();
    const reactionData = data.data;

    // Broadcast to sender
    if (currentClient.ws.readyState === WebSocket.OPEN) {
      currentClient.ws.send(JSON.stringify({
        type: 'dm-reaction-updated',
        messageId: reactionData.messageId,
        reactions: reactionData.reactions,
      }));
    }

    // Broadcast to receiver
    if (receiverId) {
      const receiverClient = activeDMClients.get(receiverId);
      if (receiverClient && receiverClient.ws.readyState === WebSocket.OPEN) {
        receiverClient.ws.send(JSON.stringify({
          type: 'dm-reaction-updated',
          messageId: reactionData.messageId,
          reactions: reactionData.reactions,
        }));
      }
    }

    console.log(`😍 DM reaction added by ${currentClient.username}: ${emoji} on ${messageId}`);
  } catch (error) {
    console.error('Error adding DM reaction:', error);
    if (currentClient.ws.readyState === WebSocket.OPEN) {
      currentClient.ws.send(JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to add reaction',
      }));
    }
  }
};

export const handleDMRemoveReaction = async (message: any, currentClient: Client | null) => {
  if (!currentClient || !currentClient.isDMConnection) return;

  const { messageId, emoji, receiverId } = message;

  try {
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001/api';
    const response = await fetch(`${userServiceUrl}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': currentClient.userId,
      },
    });

    if (!response.ok) {
      const errorData: any = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Failed to remove reaction');
    }

    const data: any = await response.json();
    const reactionData = data.data;

    // Broadcast to sender
    if (currentClient.ws.readyState === WebSocket.OPEN) {
      currentClient.ws.send(JSON.stringify({
        type: 'dm-reaction-updated',
        messageId: reactionData.messageId,
        reactions: reactionData.reactions,
      }));
    }

    // Broadcast to receiver
    if (receiverId) {
      const receiverClient = activeDMClients.get(receiverId);
      if (receiverClient && receiverClient.ws.readyState === WebSocket.OPEN) {
        receiverClient.ws.send(JSON.stringify({
          type: 'dm-reaction-updated',
          messageId: reactionData.messageId,
          reactions: reactionData.reactions,
        }));
      }
    }

    console.log(`❌ DM reaction removed by ${currentClient.username}: ${emoji} on ${messageId}`);
  } catch (error) {
    console.error('Error removing DM reaction:', error);
    if (currentClient.ws.readyState === WebSocket.OPEN) {
      currentClient.ws.send(JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to remove reaction',
      }));
    }
  }
};

/**
 * Handle user status update — broadcast to all bookclubs the user belongs to + DM clients
 */
export const handleStatusUpdate = (message: any, currentClient: Client | null) => {
  if (!currentClient) return;

  const { status } = message;
  if (!['ONLINE', 'AWAY', 'BUSY', 'OFFLINE'].includes(status)) return;

  const payload = JSON.stringify({
    type: 'user-status-update',
    userId: currentClient.userId,
    status,
  });

  // Broadcast to all bookclub clients
  activeBookClubs.forEach((club) => {
    club.clients.forEach((client) => {
      if (client.userId !== currentClient.userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    });
  });

  // Broadcast to all DM clients
  activeDMClients.forEach((client) => {
    if (client.userId !== currentClient.userId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  });

  console.log(`🔄 Status update: ${currentClient.username} → ${status}`);
};

/**
 * Handle view-section — user opened a navigation section, mark it as viewed
 */
export const handleViewSection = async (message: any, currentClient: Client | null) => {
  if (!currentClient || !currentClient.bookClubId) return;

  const { section } = message;
  const validSections = ['suggestions', 'books', 'calendar', 'meetings'];
  if (!validSections.includes(section)) return;

  try {
    await prisma.sectionRead.upsert({
      where: {
        userId_clubId_section: {
          userId: currentClient.userId,
          clubId: currentClient.bookClubId,
          section,
        },
      },
      update: { lastViewedAt: new Date() },
      create: {
        userId: currentClient.userId,
        clubId: currentClient.bookClubId,
        section,
        lastViewedAt: new Date(),
      },
    });
    console.log(`${currentClient.username} viewed section '${section}' in club ${currentClient.bookClubId}`);
  } catch (err) {
    console.error('Error updating section read:', err);
  }
};

/**
 * Handle section-activity — user added content to a section, broadcast to others
 */
export const handleSectionActivity = async (message: any, currentClient: Client | null) => {
  if (!currentClient || !currentClient.bookClubId) return;

  const { section } = message;
  const validSections = ['suggestions', 'books', 'calendar', 'meetings'];
  if (!validSections.includes(section)) return;

  const clubId = currentClient.bookClubId;

  try {
    // Record the activity timestamp
    await prisma.sectionActivity.upsert({
      where: {
        clubId_section: { clubId, section },
      },
      update: { lastActivityAt: new Date(), lastActivityBy: currentClient.userId },
      create: { clubId, section, lastActivityAt: new Date(), lastActivityBy: currentClient.userId },
    });

    // Broadcast to all other members in this bookclub
    const activeClub = activeBookClubs.get(clubId);
    if (activeClub) {
      const payload = JSON.stringify({
        type: 'section-activity',
        section,
      });
      activeClub.clients.forEach((client) => {
        if (client.userId !== currentClient.userId && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(payload);
        }
      });
    }

    console.log(`📢 Section activity: ${currentClient.username} added to '${section}' in club ${clubId}`);
  } catch (err) {
    console.error('Error handling section activity:', err);
  }
};
