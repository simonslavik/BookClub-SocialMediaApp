
import React, { useState } from 'react';
import { FiUsers } from 'react-icons/fi';
import { getProfileImageUrl } from '@config/constants';
import logger from '@utils/logger';


const ConnectedUsersArea = (
    {
        connectedUsers,
        bookClubMembers,
        auth,
        friends,
        navigate,
        selectedUserId,
        setSelectedUserId,
        handleStartDM,
        handleSendFriendRequest
    }
) => {
    const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 });
    
    return (
        <div className="w-44 bg-gray-800 border-l border-gray-700 p-2">
            <div className="flex items-center gap-2 px-2 py-1 mb-2">
              <FiUsers className="text-gray-400" size={14} />
              <h3 className="text-gray-400 text-xs font-semibold uppercase">
                Online ({connectedUsers.length})
              </h3>
            </div>
            <div className="max-h-screen overflow-y-auto w-full space-y-2">
              {bookClubMembers.map(user => {
                const isOnline = connectedUsers.some(connectedUser => connectedUser.userId === user.id);
                const isCurrentUser = user.id === auth?.user?.id;
                const isFriend = friends.some(friend => friend.id === user.id);
                return (
                  <div key={user.id} className="relative">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrentUser) {
                          navigate(`/profile/${user.id}`);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const menuWidth = 180; // min-w-[180px]
                          const spaceOnRight = window.innerWidth - rect.right;
                          
                          // Position to the left if not enough space on right
                          const left = spaceOnRight >= menuWidth + 8 
                            ? rect.right + 8 
                            : rect.left - menuWidth - 8;
                          
                          const newPosition = {
                            top: rect.top,
                            left: left
                          };
                          logger.debug('Setting menu position:', newPosition, 'Screen width:', window.innerWidth);
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
                      <span className="truncate">{user.username}</span>
                      {isFriend && (
                        <FiUsers className="text-white ml-auto" size={18} title="Friend" />
                      )}
                    </div>
                    
                    {/* User Actions Menu */}
                    {selectedUserId === user.id && !isCurrentUser && (
                      <div 
                        className="fixed bg-gray-700 border-black rounded-lg shadow-xl z-[9999] min-w-[100px]"
                        style={{
                          top: `${menuPosition.top + 45}px`
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {logger.debug('Rendering menu at:', menuPosition, 'for user:', user.id)}
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
                            handleStartDM(user.id);
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
                              handleSendFriendRequest(user.id);
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
    )
};

export default ConnectedUsersArea;