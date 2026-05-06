import { useEffect, useRef, useState, useCallback, useContext } from 'react';
import { WS_URL } from '@config/constants';
import logger from '@utils/logger';
import UIFeedbackContext from '@context/UIFeedbackContext';
import type {
  ChatMessage,
  ConnectedUser,
  ServerMessage,
} from './bookclubWebSocket/types';
import { applyServerMessageToMessages } from './bookclubWebSocket/messageReducer';

export const useBookclubWebSocket = (bookClub, currentRoom, auth, bookClubId, { onInit }: { onInit?: (...args: any[]) => void } = {}) => {
  const ws = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [bookClubMembers, setBookClubMembers] = useState<ConnectedUser[]>([]);
  const [unreadRooms, setUnreadRooms] = useState<Set<string>>(new Set());
  const [unreadSections, setUnreadSections] = useState<Set<string>>(new Set());
  const [lastReadAt, setLastReadAt] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const { toastError } = useContext(UIFeedbackContext);
  const reconnectTimeoutRef = useRef(null);
  const isIntentionalCloseRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 10;
  const currentRoomIdRef = useRef(null);
  const currentBookClubIdRef = useRef(null);
  const onInitRef = useRef(onInit);
  onInitRef.current = onInit;
  const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Track the latest prop values so the cleanup can decide whether to close
  const currentRoomPropRef = useRef(currentRoom);
  currentRoomPropRef.current = currentRoom;
  const bookClubIdPropRef = useRef(bookClubId);
  bookClubIdPropRef.current = bookClubId;

  useEffect(() => {
    if (!bookClub || !auth?.token) {
      return;
    }

    // When currentRoom is null (user is viewing a section like Suggestions/Books),
    // keep the existing WebSocket alive so section-activity notifications still work.
    if (!currentRoom) {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        logger.debug('📌 currentRoom is null (section view) — keeping WebSocket alive');
      }
      return; // No cleanup returned — previous connection stays open
    }

    // Check if we're switching rooms within the same bookclub
    const isSameBookClub = currentBookClubIdRef.current === bookClubId;
    const isRoomSwitch = isSameBookClub && currentRoomIdRef.current !== currentRoom.id;

    if (isRoomSwitch && ws.current && ws.current.readyState === WebSocket.OPEN) {
      // Just switch rooms without reconnecting
      logger.debug('🔄 Switching room from', currentRoomIdRef.current, 'to', currentRoom.id);
      currentRoomIdRef.current = currentRoom.id;
      // Clear typing indicator for the old room
      setTypingUsers([]);
      Object.values(typingTimersRef.current).forEach(clearTimeout);
      typingTimersRef.current = {};
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
        reconnectAttemptsRef.current = 0; // Reset on successful connection
        
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
          const data = JSON.parse(event.data) as ServerMessage;

          // Pure transformation of the messages array
          setMessages((prev) => applyServerMessageToMessages(prev, data));

          // Side effects on the other state slices
          switch (data.type) {
            case 'init':
              setHasMoreMessages(data.hasMore || false);
              setConnectedUsers(data.users || []);
              if (data.members) setBookClubMembers(data.members);
              setUnreadRooms(
                data.unreadRoomIds && data.unreadRoomIds.length > 0
                  ? new Set(data.unreadRoomIds)
                  : new Set(),
              );
              setLastReadAt(data.lastReadAt || null);
              setUnreadSections(
                data.unreadSections && data.unreadSections.length > 0
                  ? new Set(data.unreadSections)
                  : new Set(),
              );
              if (onInitRef.current) {
                onInitRef.current({
                  rooms: data.bookClub?.rooms || [],
                  userRole: data.userRole || null,
                });
              }
              break;

            case 'user-joined':
              setConnectedUsers((prev) =>
                prev.find((u) => u.id === data.user.id) ? prev : [...prev, data.user],
              );
              if (data.members) setBookClubMembers(data.members);
              break;

            case 'user-left':
              setConnectedUsers((prev) => prev.filter((u) => u.id !== data.userId));
              break;

            case 'room-switched':
              setUnreadRooms((prev) => {
                const next = new Set(prev);
                next.delete(data.roomId || currentRoomIdRef.current);
                return next;
              });
              setLastReadAt(data.lastReadAt || null);
              setHasMoreMessages(data.hasMore || false);
              break;

            case 'older-messages':
              setLoadingOlder(false);
              setHasMoreMessages(data.hasMore || false);
              break;

            case 'error':
              logger.error('WebSocket error:', data.message);
              toastError(data.message);
              break;

            case 'room-activity':
              if (data.roomId && data.roomId !== currentRoomIdRef.current) {
                setUnreadRooms((prev) => new Set(prev).add(data.roomId));
              }
              break;

            case 'section-activity':
              if (data.section) {
                setUnreadSections((prev) => new Set([...prev, data.section]));
              }
              break;

            case 'typing': {
              const name = data.username;
              const id = data.userId;
              if (id === auth?.user?.id) break;
              setTypingUsers((prev) => (prev.includes(name) ? prev : [...prev, name]));
              if (typingTimersRef.current[id]) clearTimeout(typingTimersRef.current[id]);
              typingTimersRef.current[id] = setTimeout(() => {
                setTypingUsers((prev) => prev.filter((u) => u !== name));
                delete typingTimersRef.current[id];
              }, 3000);
              break;
            }

            // chat-message / reaction-updated / message-edited are handled
            // entirely by the messages reducer above — no side effects.
            default:
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
          if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
            logger.error('🔌 Max reconnection attempts reached, giving up');
            toastError('Connection lost. Please refresh the page.');
            return;
          }
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000) + Math.random() * 1000;
          reconnectAttemptsRef.current += 1;
          logger.debug(`🔄 Attempting to reconnect in ${Math.round(delay / 1000)}s (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            logger.debug('Reconnecting WebSocket...');
            connectWebSocket();
          }, delay);
        }
      };
    };

    // Initial connection
    connectWebSocket();

    return () => {
      // If the user just navigated to a section view (currentRoom → null)
      // within the same bookclub, keep the WebSocket alive.
      if (currentRoomPropRef.current === null && bookClubIdPropRef.current === currentBookClubIdRef.current) {
        logger.debug('📌 Cleanup skipped — staying in same bookclub (section view)');
        return;
      }

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

  // Send a typing event to the bookclub room (throttled by caller)
  const sendTyping = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'typing' }));
    }
  }, []);

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

  // Load older messages (cursor-based pagination)
  const loadOlderMessages = useCallback(() => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN || loadingOlder || !hasMoreMessages) return;
    setLoadingOlder(true);
    // Use the timestamp of the oldest message as cursor
    setMessages(current => {
      if (current.length === 0) return current;
      const oldest = current[0];
      ws.current.send(JSON.stringify({
        type: 'load-older-messages',
        before: oldest.timestamp,
        limit: 50
      }));
      return current;
    });
  }, [loadingOlder, hasMoreMessages]);

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
    lastReadAt,
    hasMoreMessages,
    loadingOlder,
    loadOlderMessages,
    typingUsers,
    sendTyping
  };
};
