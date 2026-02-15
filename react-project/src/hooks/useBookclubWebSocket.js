import { useEffect, useRef, useState } from 'react';
import { WS_URL } from '@config/constants';
import logger from '@utils/logger';

export const useBookclubWebSocket = (bookClub, currentRoom, auth, bookClubId) => {
  const ws = useRef(null);
  const [messages, setMessages] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [bookClubMembers, setBookClubMembers] = useState([]);
  const reconnectTimeoutRef = useRef(null);
  const isIntentionalCloseRef = useRef(false);
  const currentRoomIdRef = useRef(null);
  const currentBookClubIdRef = useRef(null);

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
                attachments: msg.attachments || []
              })));
              setConnectedUsers(data.users || []);
              if (data.members) {
                setBookClubMembers(data.members);
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
                attachments: data.message.attachments || []
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
              setMessages(data.messages.map(msg => ({
                id: msg.id,
                username: msg.username,
                text: msg.content,
                timestamp: msg.createdAt,
                userId: msg.userId
              })));
              break;
            
            case 'error':
              logger.error('WebSocket error:', data.message);
              alert(data.message);
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

  return { 
    ws, 
    messages, 
    setMessages, 
    connectedUsers, 
    setConnectedUsers,
    bookClubMembers,
    setBookClubMembers
  };
};
