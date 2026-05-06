import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getProfileImageUrl } from '@config/constants';

/**
 * MentionAutocomplete
 * 
 * Appears as a dropdown above the input when user types '@'.
 * Filters members by the query after '@'.
 * On selection, inserts the display name into the visible text
 * and stores the <@userId> token in the raw message.
 * 
 * Props:
 * - members: Array of { id, username, profileImage }
 * - inputRef: Ref to the text input element
 * - onSelect: (userId, username) => void - called when a mention is selected
 * - query: The current text after '@' being typed
 * - visible: Whether the dropdown is visible
 * - onClose: () => void - called to close the dropdown
 * - selectedIndex: Current keyboard-selected index
 * - onChangeIndex: (index) => void
 */

const MentionAutocomplete = ({
  members = [],
  query = '',
  visible = false,
  onSelect,
  onClose,
  selectedIndex = 0,
  onChangeIndex,
  position = { bottom: '100%', left: 0 }
}) => {
  const listRef = useRef(null);

  // Filter members by the query
  const filteredMembers = React.useMemo(() => {
    const q = query.toLowerCase();

    // Always include @everyone option
    const everyone = { id: 'everyone', username: 'everyone', isEveryone: true };
    const memberList = [everyone, ...members];

    if (!q) return memberList.slice(0, 10);
    
    return memberList
      .filter(m => (m.username || m.name || '').toLowerCase().includes(q))
      .slice(0, 10);
  }, [members, query]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[data-mention-item]');
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!visible || filteredMembers.length === 0) return null;

  return (
    <div
      className="absolute z-50 w-72 max-h-48 overflow-y-auto bg-gray-800 border border-gray-600 rounded-lg shadow-xl"
      style={{ bottom: position.bottom, left: position.left }}
    >
      <div ref={listRef} className="py-1">
        {filteredMembers.map((member, idx) => (
          <button
            key={member.id}
            data-mention-item
            type="button"
            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
              idx === selectedIndex
                ? 'bg-indigo-700/40 text-white'
                : 'text-gray-200 hover:bg-gray-700'
            }`}
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent input blur
              onSelect(member.id, member.username || member.name);
            }}
            onMouseEnter={() => onChangeIndex?.(idx)}
          >
            {member.isEveryone ? (
              <div className="w-7 h-7 rounded-full bg-yellow-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-yellow-300">@</span>
              </div>
            ) : (
              <img
                src={getProfileImageUrl(member.profileImage) || '/images/default.webp'}
                alt={member.username}
                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).src = '/images/default.webp'; }}
              />
            )}
            <span className="font-medium truncate">
              {member.isEveryone ? '@everyone' : member.username || member.name}
            </span>
            {member.isEveryone && (
              <span className="ml-auto text-xs text-gray-400">Notify all</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MentionAutocomplete;
