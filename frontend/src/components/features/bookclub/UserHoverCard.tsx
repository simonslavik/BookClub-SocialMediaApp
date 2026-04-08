import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiUserPlus } from 'react-icons/fi';
import { getProfileImageUrl } from '@config/constants';
import { getStatusColor } from './statusUtils';

/**
 * A hover card that displays basic user info with action buttons.
 * Wraps around a child element (typically an avatar image).
 *
 * Props:
 *  - user: { id, username, profileImage, status, role, email? }
 *  - currentUserId: string — the logged-in user's ID
 *  - isFriend: boolean
 *  - isOnline: boolean
 *  - onSendFriendRequest: (userId) => void
 *  - children: the trigger element (e.g. <img />)
 *  - disabled: boolean — if true the hover card is not shown
 */
const UserHoverCard = ({
  user,
  currentUserId,
  isFriend = false,
  isOnline = false,
  onSendFriendRequest,
  children,
  disabled = false,
  className = '',
}) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const cardRef = useRef(null);
  const showTimeout = useRef(null);
  const hideTimeout = useRef(null);
  const navigate = useNavigate();

  // Don't show hover card for self
  const isSelf = user?.id === currentUserId;

  const show = useCallback(() => {
    if (disabled || isSelf) return;
    clearTimeout(hideTimeout.current);
    showTimeout.current = setTimeout(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const cardWidth = 240;
      const cardHeight = 180;

      let top = rect.top - cardHeight - 8;
      let left = rect.left + rect.width / 2 - cardWidth / 2;

      // If card would go above viewport, show below
      if (top < 8) {
        top = rect.bottom + 8;
      }
      // Keep within horizontal bounds
      if (left < 8) left = 8;
      if (left + cardWidth > window.innerWidth - 8) left = window.innerWidth - cardWidth - 8;

      setPosition({ top, left });
      setVisible(true);
    }, 400);
  }, [disabled, isSelf]);

  const hide = useCallback(() => {
    clearTimeout(showTimeout.current);
    hideTimeout.current = setTimeout(() => {
      setVisible(false);
    }, 200);
  }, []);

  const keepOpen = useCallback(() => {
    clearTimeout(hideTimeout.current);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(showTimeout.current);
      clearTimeout(hideTimeout.current);
    };
  }, []);

  // Close on scroll
  useEffect(() => {
    if (!visible) return;
    const handleScroll = () => setVisible(false);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [visible]);

  const status = isOnline ? (user?.status || 'ONLINE') : 'OFFLINE';
  const statusLabel = status.charAt(0) + status.slice(1).toLowerCase();

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        className={`inline-block ${className}`}
      >
        {children}
      </div>

      {visible && (
        <div
          ref={cardRef}
          onMouseEnter={keepOpen}
          onMouseLeave={hide}
          className="fixed z-[9999] w-60 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl overflow-hidden animate-in fade-in duration-150"
          style={{ top: position.top, left: position.left }}
        >
          {/* Banner / top accent */}
          <div className="h-12 bg-stone-700 relative">
            <div className="absolute -bottom-5 left-4">
              <div className="relative">
                <img
                  src={getProfileImageUrl(user?.profileImage) || '/images/default.webp'}
                  alt={user?.username}
                  className="w-12 h-12 rounded-full object-cover border-[3px] border-gray-800 cursor-pointer hover:ring-2 hover:ring-stone-500 transition-all"
                  onClick={() => {
                    setVisible(false);
                    navigate(`/profile/${user?.id}`);
                  }}
                  onError={(e) => { e.target.src = '/images/default.webp'; }}
                />
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${getStatusColor(status)}`} />
              </div>
            </div>
          </div>

          {/* User info */}
          <div className="pt-7 px-4 pb-3">
            <div className="flex items-center gap-1.5">
              <span
                className="text-white text-sm font-semibold cursor-pointer hover:text-stone-500 hover:underline transition-colors truncate"
                onClick={() => {
                  setVisible(false);
                  navigate(`/profile/${user?.id}`);
                }}
              >
                {user?.username}
              </span>
            </div>
            <span className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
              {statusLabel}
            </span>
          </div>

          {/* Action buttons */}
          <div className="px-3 pb-3 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setVisible(false);
                navigate(`/dm/${user?.id}`);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-medium py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <FiMessageSquare size={13} />
              Message
            </button>
            {!isFriend && onSendFriendRequest && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSendFriendRequest(user?.id);
                  setVisible(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-stone-700 hover:bg-stone-500 text-white text-xs font-medium py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <FiUserPlus size={13} />
                Add Friend
              </button>
            )}
            {isFriend && (
              <span className="flex-1 flex items-center justify-center gap-1.5 text-pink-400 text-xs font-medium py-1.5">
                ♥ Friends
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default UserHoverCard;
