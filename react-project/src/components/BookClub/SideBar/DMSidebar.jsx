import React, { useState } from 'react';
import { FiMessageCircle, FiUsers } from 'react-icons/fi';

const DMSidebar = ({ conversations, friends = [], currentConversation, onSelectConversation, onStartConversation }) => {
  const [view, setView] = useState('conversations'); // 'conversations' or 'friends'
  
  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 gap-2 flex justify-start flex-col">
        <button 
          onClick={() => setView('friends')}
          className={`flex text-sm items-center gap-2 px-3 py-2 rounded transition-colors ${
            view === 'friends' 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <FiUsers size={15} />
          Friends
        </button>
        
        <button 
          onClick={() => setView('conversations')}
          className={`flex text-sm items-center gap-2 px-3 py-2 rounded transition-colors ${
            view === 'conversations' 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <FiMessageCircle size={15} />
          Direct Messages
        </button>
      </div>

      {/* List - Conversations or Friends */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {view === 'friends' ? (
            // Friends List
            friends.length === 0 ? (
              <div className="text-center text-gray-500 py-8 text-sm">
                No friends yet
              </div>
            ) : (
              friends.map(friend => (
                <button
                  key={friend.id}
                  onClick={() => {
                    onStartConversation(friend.id);
                    setView('conversations');
                  }}
                  className="w-full p-3 rounded mb-1 text-left transition-colors hover:bg-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={friend.profileImage 
                        ? `http://localhost:3001${friend.profileImage}` 
                        : '/images/default.webp'
                      }
                      alt={friend.name}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => { e.target.src = '/images/default.webp'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-white font-medium truncate block">
                        {friend.name}
                      </span>
                      <p className="text-gray-400 text-xs truncate">
                        {friend.email}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )
          ) : (
            // Conversations List - Shows all users you've messaged (friends or not)
            conversations.length === 0 ? (
              <div className="text-center text-gray-500 py-8 text-sm">
                No conversations yet
              </div>
            ) : (
              conversations
                .filter(conv => conv.friend) // 'friend' is the property name but includes all users
                .map(conv => (
                <button
                  key={conv.friend.id}
                  onClick={() => onSelectConversation(conv.friend.id)}
                  className={`w-full p-3 rounded mb-1 text-left transition-colors ${
                    currentConversation === conv.friend.id
                      ? 'bg-gray-700'
                      : 'hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={conv.friend.profileImage 
                        ? `http://localhost:3001${conv.friend.profileImage}` 
                        : '/images/default.webp'
                      }
                      alt={conv.friend.name}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => { e.target.src = '/images/default.webp'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium truncate">
                          {conv.friend.name}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="bg-purple-600 text-white text-xs rounded-full px-2 py-0.5">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <p className="text-gray-400 text-sm truncate">
                          {conv.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default DMSidebar;
