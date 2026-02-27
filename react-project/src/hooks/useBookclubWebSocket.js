import { useEffect, useRef, useState, useCallback } from 'react';
import { WS_URL } from '@config/constants';
import logger from '@utils/logger';

export const useBookclubWebSocket = (bookClub, currentRoom, auth, bookClubId, { onInit } = {}) => {
  const ws = useRef(null);
  const [messages, setMessages] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [bookClubMembers, setBookClubMembers] = useState([]);
  const [unreadRooms, setUnreadRooms] = useState(new Set());
  const [unreadSections, setUnreadSections] = useState(new Set());
  const [lastReadAt, setLastReadAt] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  const isIntentionalCloseRef = useRef(false);
  const currentRoomIdRef = useRef(null);
  const currentBookClubIdRef = useRef(null);
  const onInitRef = useRef(onInit);
  onInitRef.current = onInit;

  useEffect(() => {
    if (!bookClub || !auth?.token || !currentRoom) {
      logger.debug('WebSocket not connecting - missing required data:', {
        hasBookClub: !!bookClub,
        hasAuth: !!auth?.token,
        hasRoom: !!currentRoom
      });
      return;
    }

    // Check if we're switching rooms within the same bookclub
    const isSameBookClub = currentBookClubIdRef.current === bookClubId;
    const isRoomSwitch = isSameBookClub && currentRoomIdRef.current !== currentRoom.id;

    if (isRoomSwitch && ws.current && ws.current.readyState === WebSocket.OPEN) {
      // Just switch rooms without reconnecting
      logger.debug('🔄 Switching room from', currentRoomIdRef.current, 'to', currentRoom.id);
      currentRoomIdRef.current = currentRoom.id;
      ws.current.send(JSON.stringify({
        type: 'switch-room',
        roomId: currentRoom.id,
        userId: auth.user.id,
        username: auth.user.name || 'Anonymous'
      }));
      return;
    }

    // Need to establish new connection (different bookclub or no existing connection)
    logger.debug('Establishing new WebSocket connection for bookclub:', bookClubId);
    
    // Reset the intentional close flag for new connection
    isIntentionalCloseRef.current = false;

    const connectWebSocket = () => {
      const wsUrl = WS_URL;
      
      logger.debug('Attempting to connect WebSocket to:', wsUrl);
      const socket = new WebSocket(wsUrl);
      ws.current = socket;

      socket.onopen = () => {
        logger.debug('✅ WebSocket connected to bookclub:', bookClubId);
        
        // Check if this socket is still the current one (not replaced by another effect run)
        if (ws.current !== socket) {
          logger.debug('Socket replaced, closing old connection');
          socket.close();
          return;
        }
        
        const username = auth.user.name || 'Anonymous';
        const profileImage = auth.user.profileImage || null;
        currentRoomIdRef.current = currentRoom.id;
        currentBookClubIdRef.current = bookClubId;
        socket.send(JSON.stringify({
          type: 'join',
          bookClubId: bookClubId,
          userId: auth.user.id,
          username: username,
          profileImage: profileImage,
          roomId: currentRoom.id,
          token: auth.token
        }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'init':
              setMessages(data.messages.map(msg => ({
                id: msg.id,
                username: msg.username,
                profileImage: msg.profileImage,
                text: msg.content,
                timestamp: msg.createdAt,
                userId: msg.userId,
                isPinned: msg.isPinned,
                deletedAt: msg.deletedAt,
                deletedBy: msg.deletedBy,
                editedAt: msg.editedAt,
                replyToId: msg.replyToId,
                replyTo: msg.replyTo || null,
                attachments: msg.attachments || [],
                reactions: msg.reactions || []
              })));
              setConnectedUsers(data.users || []);
              if (data.members) {
                setBookClubMembers(data.members);
              }
              // Populate unread rooms from server
              if (data.unreadRoomIds && data.unreadRoomIds.length > 0) {
                setUnreadRooms(new Set(data.unreadRoomIds));
              } else {
                setUnreadRooms(new Set());
              }
              // Set lastReadAt for the current room
              setLastReadAt(data.lastReadAt || null);
              // Populate unread sections from server
              if (data.unreadSections && data.unreadSections.length > 0) {
                setUnreadSections(new Set(data.unreadSections));
              } else {
                setUnreadSections(new Set());
              }
              // Notify parent about init data (rooms with types, user role)
              if (onInitRef.current) {
                onInitRef.current({
                  rooms: data.bookClub?.rooms || [],
                  userRole: data.userRole || null
                });
              }
              break;
            
            case 'chat-message':
              setMessages(prev => [...prev, {
                id: data.message.id,
                username: data.message.username,
                profileImage: data.message.profileImage,
                text: data.message.content,
                timestamp: data.message.createdAt,
                userId: data.message.userId,
                isPinned: data.message.isPinned || false,
                deletedAt: data.message.deletedAt,
                deletedBy: data.message.deletedBy,
                editedAt: data.message.editedAt,
                replyToId: data.message.replyToId,
                replyTo: data.message.replyTo || null,
                attachments: data.message.attachments || [],
                reactions: data.message.reactions || []
              }]);
              break;
            
            case 'user-joined':
              setConnectedUsers(prev => {
                if (!prev.find(u => u.id === data.user.id)) {
                  return [...prev, data.user];
                }
                return prev;
              });
              if (data.members) {
                setBookClubMembers(data.members);
              }
              setMessages(prev => [...prev, {
                type: 'system',
                text: `${data.user.username} joined the room`,
                timestamp: new Date().toISOString()
              }]);
              break;
            
            case 'user-left':
              setConnectedUsers(prev => prev.filter(u => u.id !== data.userId));
              setMessages(prev => [...prev, {
                type: 'system',
                text: `${data.username} left the room`,
                timestamp: new Date().toISOString()
              }]);
              break;
            
            case 'room-switched':
              // Clear unread for the room we just switched to
              setUnreadRooms(prev => {
                const next = new Set(prev);
                next.delete(data.roomId || currentRoomIdRef.current);
                return next;
              });
              // Set lastReadAt for the switched room
              setLastReadAt(data.lastReadAt || null);
              setMessages(data.messages.map(msg => ({
                id: msg.id,
                username: msg.username,
                profileImage: msg.profileImage,
                text: msg.content,
                timestamp: msg.createdAt,
                userId: msg.userId,
                isPinned: msg.isPinned,
                deletedAt: msg.deletedAt,
                deletedBy: msg.deletedBy,
                editedAt: msg.editedAt,
                replyToId: msg.replyToId,
                replyTo: msg.replyTo || null,
                attachments: msg.attachments || [],
                reactions: msg.reactions || []
              })));
              break;
            
            case 'reaction-updated':
              setMessages(prev => prev.map(msg =>
                msg.id === data.messageId
                  ? { ...msg, reactions: data.reactions }
                  : msg
              ));
              break;

            case 'message-edited':
              setMessages(prev => prev.map(msg =>
                msg.id === data.messageId
                  ? { ...msg, text: data.content, editedAt: data.editedAt }
                  : msg
              ));
              break;
            
            case 'error':
              logger.error('WebSocket error:', data.message);
              alert(data.message);
              break;

            case 'room-activity':
              // A message was posted in another room — mark it as unread
              if (data.roomId && data.roomId !== currentRoomIdRef.current) {
                setUnreadRooms(prev => {
                  const next = new Set(prev).add(data.roomId);
                  return next;
                });
              }
              break;

            case 'section-activity':
              // Something was added to a navigation section by another user
              if (data.section) {
                setUnreadSections(prev => new Set([...prev, data.section]));
              }
              break;
          }
        } catch (err) {
          logger.error('Error processing WebSocket message:', err);
        }
      };

      socket.onerror = (error) => {
        logger.error('❌ WebSocket error:', error);
      };

      socket.onclose = (event) => {
        logger.debug('📪 WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
        
        // Only clear ws.current if this socket is still the current one
        if (ws.current === socket) {
          ws.current = null;
        }
        
        // Only attempt to reconnect if it wasn't an intentional close and socket is still current
        if (!isIntentionalCloseRef.current && ws.current === null) {
          logger.debug('🔄 Attempting to reconnect in 3 seconds...');
          reconnectTimeoutRef.current = setTimeout(() => {
            logger.debug('Reconnecting WebSocket...');
            connectWebSocket();
          }, 3000);
        }
      };
    };

    // Initial connection
    connectWebSocket();

    return () => {
      // Mark this as an intentional close
      isIntentionalCloseRef.current = true;
      
      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close the WebSocket and reset refs
      if (ws.current) {
        if (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING) {
          ws.current.close();
        }
        ws.current = null;
      }
      
      // Reset tracking refs when switching bookclubs
      currentRoomIdRef.current = null;
      currentBookClubIdRef.current = null;
    };
  }, [bookClubId, currentRoom?.id, auth?.token]); // Reconnect when bookclub, room, or auth changes

  // Mark a section as viewed — clears the unread indicator and tells the server
  const viewSection = useCallback((section) => {
    setUnreadSections(prev => {
      const next = new Set(prev);
      next.delete(section);
      return next;
    });
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'view-section', section }));
    }
  }, []);

  // Notify other users that content was added to a section
  const notifySectionActivity = useCallback((section) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'section-activity', section }));
    }
  }, []);

  return { 
    ws, 
    messages, 
    setMessages, 
    connectedUsers, 
    setConnectedUsers,
    bookClubMembers,
    setBookClubMembers,
    unreadRooms,
    setUnreadRooms,
    unreadSections,
    viewSection,
    notifySectionActivity,
    lastReadAt
  };
};
