import React, { useState, useRef, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { getProfileImageUrl } from '@config/constants';
import { userAPI } from '@api/user.api';
import logger from '@utils/logger';

const DMSidebar = ({ conversations, friends = [], currentConversation, onSelectConversation, onStartConversation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchTimeout = useRef(null);
  const inputRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Show friends as suggestions when search is focused but empty
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await userAPI.searchUsers(searchQuery.trim());
        const users = res.data || res.users || res || [];
        setSearchResults(Array.isArray(users) ? users : []);
      } catch (err) {
        logger.error('Error searching users:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  const friendIds = new Set(friends.map(f => f.friend?.id));

  // Normalize friend objects to flat user shape for display
  const flatFriends = friends
    .filter(f => f.friend)
    .map(f => ({
      id: f.friend.id,
      name: f.friend.name,
      username: f.friend.username,
      profileImage: f.friend.profileImage,
    }));

  // When search is open but query is empty, show first 5 friends as suggestions
  const displayResults = searchQuery.trim()
    ? [
        // Friends matching the query first
        ...searchResults.filter(u => friendIds.has(u.id)),
        // Then non-friends
        ...searchResults.filter(u => !friendIds.has(u.id)),
      ]
    : flatFriends.slice(0, 5);

  const handleSelectUser = (userId) => {
    onStartConversation(userId);
    setSearchQuery('');
    setShowSearch(false);
  };

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white text-sm font-semibold">Direct Messages</span>
        </div>

        {/* Search bar */}
        <div className="relative">
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearch(true)}
            placeholder="Find or start a conversation"
            className="w-full pl-8 pr-7 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {(searchQuery || showSearch) && (
            <button
              onClick={() => { setSearchQuery(''); setShowSearch(false); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Search results dropdown */}
      {showSearch && (
        <div className="border-b border-gray-700 max-h-60 overflow-y-auto">
          {searching && (
            <div className="text-center text-gray-500 py-3 text-xs">Searching...</div>
          )}
          {!searching && displayResults.length === 0 && searchQuery.trim() && (
            <div className="text-center text-gray-500 py-3 text-xs">No users found</div>
          )}
          {!searching && displayResults.length === 0 && !searchQuery.trim() && flatFriends.length === 0 && (
            <div className="text-center text-gray-500 py-3 text-xs">Type to search for users</div>
          )}
          {!searching && displayResults.map(user => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user.id)}
              className="w-full px-3 py-2 text-left transition-colors hover:bg-gray-700 flex items-center gap-2.5"
            >
              <img
                src={getProfileImageUrl(user.profileImage) || '/images/default.webp'}
                alt={user.name || user.username}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                onError={(e) => { e.target.src = '/images/default.webp'; }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-white text-sm truncate block">{user.name || user.username}</span>
                {friendIds.has(user.id) && (
                  <span className="text-xs text-purple-400">Friend</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {conversations.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-sm">
              No conversations yet
            </div>
          ) : (
            conversations
              .filter(conv => conv.friend)
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
                    src={getProfileImageUrl(conv.friend.profileImage) || '/images/default.webp'}
                    alt={conv.friend.name || 'User'}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-semibold text-sm truncate">
                        {conv.friend.name || 'Unknown User'}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="bg-purple-600 text-white text-xs rounded-full px-2 py-0.5 flex-shrink-0 ml-2">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs truncate">
                      {conv.lastMessage?.content || 
                       (conv.lastMessage?.attachments && conv.lastMessage.attachments.length > 0 
                         ? '📎 File sent' 
                         : 'No messages yet')}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DMSidebar;
