import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiStar, FiShield, FiAward, FiHeart, FiSearch, FiX } from 'react-icons/fi';
import { getProfileImageUrl } from '@config/constants';
import { getStatusColor } from './statusUtils';
import UserHoverCard from './UserHoverCard';
import logger from '@utils/logger';

// Role badge component
const RoleBadge = ({ role }) => {
  const roleConfig = {
    OWNER: { icon: FiStar, color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Owner' },
    ADMIN: { icon: FiShield, color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'Admin' },
    MODERATOR: { icon: FiAward, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Mod' },
    MEMBER: { icon: null, color: '', bg: '', label: '' }
  };

  const config = roleConfig[role] || roleConfig.MEMBER;
  if (!config.icon) return null;

  const Icon = config.icon;

  return (
    <div 
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${config.bg}`}
      title={config.label}
    >
      <Icon className={config.color} size={12} />
    </div>
  );
};

const ConnectedUsersSidebar = ({ 
  bookClubMembers, 
  connectedUsers, 
  friends = [], 
  auth,
  onSendFriendRequest
}) => {
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!selectedUserId) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setSelectedUserId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedUserId]);

  // Debug logging
  logger.debug('ConnectedUsersSidebar - bookClubMembers:', bookClubMembers);
  logger.debug('ConnectedUsersSidebar - sample member:', bookClubMembers[0]);
  logger.debug('ConnectedUsersSidebar - friends:', friends);
  logger.debug('ConnectedUsersSidebar - friends length:', friends.length);

  // Sort users by role hierarchy: OWNER > ADMIN > MODERATOR > MEMBER
  const roleOrder = { OWNER: 1, ADMIN: 2, MODERATOR: 3, MEMBER: 4 };
  const sortedMembers = [...bookClubMembers].sort((a, b) => {
    const orderA = roleOrder[a.role] || 5;
    const orderB = roleOrder[b.role] || 5;
    return orderA - orderB;
  });

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return sortedMembers;
    const query = searchQuery.toLowerCase();
    return sortedMembers.filter(user =>
      user.username?.toLowerCase().includes(query)
    );
  }, [sortedMembers, searchQuery]);

  return (
    <div className="w-44 bg-gray-800 border-l border-gray-700 p-2">
      <button
        onClick={() => setShowMembersModal(true)}
        className="flex items-center gap-2 px-2 py-1.5 mb-2 w-full rounded-md hover:bg-gray-700 transition-colors group cursor-pointer"
      >
        <FiUsers className="text-gray-400 group-hover:text-indigo-400 transition-colors" size={14} />
        <h3 className="text-gray-400 group-hover:text-indigo-400 text-xs font-semibold uppercase transition-colors">
          Members
        </h3>
        <span className="ml-auto bg-gray-700 group-hover:bg-indigo-500/20 text-gray-300 group-hover:text-indigo-400 text-xs font-bold px-1.5 py-0.5 rounded-full transition-colors">
          {bookClubMembers.length}
        </span>
      </button>

      {/* Search bar */}
      <div className="relative px-1 mb-2">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
        <input
          type="text"
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-700/50 border border-gray-600 rounded-md py-1 pl-7 pr-6 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            <FiX size={12} />
          </button>
        )}
      </div>

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center" onClick={() => setShowMembersModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <FiUsers className="text-indigo-400" size={18} />
                <h2 className="text-white font-semibold text-lg">All Members</h2>
                <span className="bg-indigo-500/20 text-indigo-400 text-xs font-bold px-2 py-0.5 rounded-full">{bookClubMembers.length}</span>
              </div>
              <button onClick={() => setShowMembersModal(false)} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded-md">
                <FiX size={18} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-3 space-y-1">
              {sortedMembers.map(user => {
                const isOnline = connectedUsers.some(cu => cu.userId === user.id);
                const isFriend = friends.some(f => f.friend?.id === user.id);
                const isCurrentUser = user.id === auth?.user?.id;
                return (
                  <div
                    key={user.id}
                    onClick={() => { navigate(`/profile/${user.id}`); setShowMembersModal(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-700/60 cursor-pointer transition-colors"
                  >
                    <div className="relative">
                      <UserHoverCard
                        user={user}
                        currentUserId={auth?.user?.id}
                        isFriend={isFriend}
                        isOnline={isOnline}
                        onSendFriendRequest={onSendFriendRequest}
                      >
                        <img
                          src={getProfileImageUrl(user.profileImage) || '/images/default.webp'}
                          alt={user.username}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => { e.target.src = '/images/default.webp'; }}
                        />
                      </UserHoverCard>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${getStatusColor(isOnline ? (user.status || 'ONLINE') : 'OFFLINE')}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium truncate">{user.username}</span>
                        {isCurrentUser && <span className="text-xs text-gray-500">(you)</span>}
                        <RoleBadge role={user.role} />
                        {isFriend && <FiHeart className="text-pink-500 fill-pink-500" size={14} />}
                      </div>
                      <span className={`text-xs ${isOnline ? 'text-green-400' : 'text-gray-500'}`}>{isOnline ? (user.status ? user.status.charAt(0) + user.status.slice(1).toLowerCase() : 'Online') : 'Offline'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <div className="max-h-screen overflow-y-auto w-full space-y-2">
        {filteredMembers.length === 0 && searchQuery && (
          <p className="text-gray-500 text-xs text-center py-3">No members found</p>
        )}
        {filteredMembers.map(user => {
          const isOnline = connectedUsers.some(connectedUser => connectedUser.userId === user.id);
          const isCurrentUser = user.id === auth?.user?.id;
          const isFriend = friends.some(f => f.friend?.id === user.id);
          
          // Debug logging for each user
          logger.debug(`User ${user.username} - ID: ${user.id}, isFriend: ${isFriend}`, {
            user,
            friendsIds: friends.map(f => f.friend?.id)
          });
          
          return (
            <div key={user.id} className="relative" ref={selectedUserId === user.id ? menuRef : null}>
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  if (isCurrentUser) {
                    navigate(`/profile/${user.id}`);
                  } else {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const menuWidth = 180;
                    const spaceOnRight = window.innerWidth - rect.right;
                    
                    const left = spaceOnRight >= menuWidth + 8 
                      ? rect.right + 8 
                      : rect.left - menuWidth - 8;
                    
                    const newPosition = { top: rect.top, left: left };
                    setMenuPosition(newPosition);
                    setSelectedUserId(selectedUserId === user.id ? null : user.id);
                  }
                }}
                className="px-2 py-1 text-sm text-gray-300 flex items-center gap-2 hover:bg-gray-700 rounded cursor-pointer"
              >
                <div className="relative">
                  <UserHoverCard
                    user={user}
                    currentUserId={auth?.user?.id}
                    isFriend={isFriend}
                    isOnline={isOnline}
                    onSendFriendRequest={onSendFriendRequest}
                  >
                    <img 
                      src={getProfileImageUrl(user.profileImage) || '/images/default.webp'} 
                      alt={user.username} 
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => { e.target.src = '/images/default.webp'; }}
                    />
                  </UserHoverCard>
                  <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-800 ${getStatusColor(isOnline ? (user.status || 'ONLINE') : 'OFFLINE')}`}></div>
                </div>
                <div className="flex-1 flex items-center gap-1.5 min-w-0">
                  <span className="truncate">{user.username}</span>
                  <RoleBadge role={user.role} />
                </div>
                {isFriend && (
                  <FiHeart className="text-pink-500 fill-pink-500" size={16} title="Friend" />
                )}
              </div>
              
              {/* User Actions Menu */}
              {selectedUserId === user.id && !isCurrentUser && (
                <div 
                  className="fixed bg-gray-700 border-black rounded-lg shadow-xl z-[9999] min-w-[100px]"
                  style={{ top: `${menuPosition.top + 45}px` }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${user.id}`);
                      setSelectedUserId(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-600 rounded-t-lg transition-colors"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dm/${user.id}`);
                      setSelectedUserId(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-600 transition-colors border-t border-gray-600"
                  >
                    Send a DM
                  </button>
                  
                  {!isFriend && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSendFriendRequest(user.id);
                        setSelectedUserId(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-600 rounded-b-lg transition-colors border-t border-gray-600"
                    >
                      Add to Friends
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConnectedUsersSidebar;
