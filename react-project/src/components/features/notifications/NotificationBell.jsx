import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheck, FiCheckCircle, FiX } from 'react-icons/fi';
import { AuthContext } from '@context/index';
import apiClient from '@api/axios';
import logger from '@utils/logger';

const NOTIFICATION_WS_URL = import.meta.env.VITE_NOTIFICATION_WS_URL || 'ws://localhost:3005/ws';

const NOTIFICATION_ICONS = {
  meeting_created: '📅',
  meeting_updated: '📝',
  meeting_cancelled: '❌',
  meeting_reminder_24h: '📅',
  meeting_reminder_1h: '⏰',
  meeting_meeting_starting: '🚀',
};

const NotificationBell = () => {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/v1/notifications/unread-count');
      if (data.success) {
        setUnreadCount(data.count);
      }
    } catch (err) {
      logger.error('Failed to fetch notification unread count:', err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/v1/notifications?limit=20');
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      logger.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch unread count on mount
  useEffect(() => {
    if (!auth?.token) return;
    fetchUnreadCount();
  }, [auth?.token, fetchUnreadCount]);

  // WebSocket connection for real-time notifications
  useEffect(() => {
    if (!auth?.token) return;

    let unmounted = false;

    const connect = () => {
      if (unmounted) return;

      try {
        const ws = new WebSocket(NOTIFICATION_WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          logger.debug('Notification WS connected');
          // Authenticate
          ws.send(JSON.stringify({ type: 'auth', token: auth.token }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'auth-success') {
              logger.debug('Notification WS authenticated');
              return;
            }

            if (data.type === 'auth-error') {
              logger.error('Notification WS auth error:', data.message);
              return;
            }

            if (data.type === 'notification') {
              // New notification received in real-time
              setNotifications(prev => [data.data, ...prev]);
              setUnreadCount(prev => prev + 1);
            }
          } catch (err) {
            logger.error('Notification WS parse error:', err);
          }
        };

        ws.onclose = () => {
          if (!unmounted) {
            logger.debug('Notification WS disconnected, reconnecting in 5s...');
            reconnectTimerRef.current = setTimeout(connect, 5000);
          }
        };

        ws.onerror = (err) => {
          logger.error('Notification WS error:', err);
        };
      } catch (err) {
        logger.error('Notification WS connect error:', err);
        if (!unmounted) {
          reconnectTimerRef.current = setTimeout(connect, 5000);
        }
      }
    };

    connect();

    return () => {
      unmounted = true;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [auth?.token]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleToggle = () => {
    if (!showDropdown) {
      fetchNotifications();
    }
    setShowDropdown(!showDropdown);
  };

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await apiClient.patch(`/v1/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      logger.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/v1/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      logger.error('Failed to mark all notifications read:', err);
    }
  };

  const handleDismiss = async (id, e) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/v1/notifications/${id}`);
      const dismissed = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (dismissed && !dismissed.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      logger.error('Failed to dismiss notification:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      apiClient.patch(`/v1/notifications/${notification.id}/read`).catch(() => {});
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Navigate to the bookclub if we have a clubId
    if (notification.clubId) {
      navigate(`/bookclub/${notification.clubId}`);
      setShowDropdown(false);
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (!auth?.user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative px-2 py-2 text-black rounded hover:bg-gray-100 transition cursor-pointer"
      >
        <FiBell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center font-semibold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[500px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
              >
                <FiCheckCircle size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="text-center text-gray-500 py-8 text-sm">Loading...</div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="text-center py-8">
                <FiBell className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No notifications yet</p>
              </div>
            )}
            {!loading && notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group ${
                  !n.read ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {NOTIFICATION_ICONS[n.type] || '🔔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {!n.read && (
                      <button
                        onClick={(e) => handleMarkRead(n.id, e)}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                        title="Mark as read"
                      >
                        <FiCheck size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDismiss(n.id, e)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Dismiss"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
