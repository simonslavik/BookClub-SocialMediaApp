import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiStar, FiShield, FiAward, FiHeart } from 'react-icons/fi';
import { getProfileImageUrl } from '@config/constants';
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

  return (
    <div className="w-44 bg-gray-800 border-l border-gray-700 p-2">
      <div className="flex items-center gap-2 px-2 py-1 mb-2">
        <FiUsers className="text-gray-400" size={14} />
        <h3 className="text-gray-400 text-xs font-semibold uppercase">
          Online ({connectedUsers.length})
        </h3>
      </div>
      <div className="max-h-screen overflow-y-auto w-full space-y-2">
        {sortedMembers.map(user => {
          const isOnline = connectedUsers.some(connectedUser => connectedUser.userId === user.id);
          const isCurrentUser = user.id === auth?.user?.id;
          const isFriend = friends.some(f => f.friend?.id === user.id);
          
          // Debug logging for each user
          logger.debug(`User ${user.username} - ID: ${user.id}, isFriend: ${isFriend}`, {
            user,
            friendsIds: friends.map(f => f.friend?.id)
          });
          
          return (
            <div key={user.id} className="relative">
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
                  <img 
                    src={getProfileImageUrl(user.profileImage) || '/images/default.webp'} 
                    alt={user.username} 
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                  />
                  <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-800 ${
                    isOnline ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
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
