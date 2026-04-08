import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FiX, FiCornerUpLeft } from 'react-icons/fi';
import FileUpload from '../../common/FileUpload';
import logger from '@utils/logger';
import EmojiPickerButton from './chat/EmojiPickerButton';
import MentionAutocomplete from './chat/MentionAutocomplete';

/**
 * Build the raw message (with <@userId> tokens) from display text and mention markers.
 * Markers are sorted by position and encode { start, end, userId, displayText }.
 */
const buildRawMessage = (displayText, mentions) => {
  if (!mentions || mentions.length === 0) return displayText;

  // Sort mentions by start position (ascending)
  const sorted = [...mentions].sort((a, b) => a.start - b.start);
  let raw = '';
  let cursor = 0;

  for (const m of sorted) {
    // Add text before this mention
    raw += displayText.slice(cursor, m.start);
    // Replace display text with token
    raw += `<@${m.userId}>`;
    cursor = m.end;
  }
  // Add remaining text
  raw += displayText.slice(cursor);
  return raw;
};

const MessageInput = ({ 
  newMessage,
  setNewMessage,
  selectedFiles,
  uploadingFiles,
  currentRoom,
  fileUploadRef,
  onFilesSelected,
  onSubmit,
  auth,
  members = [],
  onGetRawMessage,
  replyingTo,
  onCancelReply,
  onTyping
}) => {
  // Mention tracking
  const [mentionMarkers, setMentionMarkers] = useState([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionVisible, setMentionVisible] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const inputRef = useRef(null);
  const lastTypingSentRef = useRef(0);

  const handleEmojiInsert = (emoji) => {
    setNewMessage((prev) => prev + emoji);
  };

  // Detect '@' trigger while typing
  const handleChange = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setNewMessage(value);

    // Emit typing event (throttled to once every 2s)
    if (onTyping) {
      const now = Date.now();
      if (now - lastTypingSentRef.current > 2000) {
        lastTypingSentRef.current = now;
        onTyping();
      }
    }

    // Adjust mention markers when text changes before them
    // (simple approach: invalidate markers that overlap with edits)
    const oldLen = newMessage.length;
    const newLen = value.length;
    const diff = newLen - oldLen;

    if (diff !== 0 && mentionMarkers.length > 0) {
      // Shift markers that come after the cursor, remove ones that overlap
      setMentionMarkers(prev => {
        const editPos = cursorPos - Math.max(diff, 0); // approximate edit position
        return prev
          .filter(m => {
            // Remove markers that were edited into (user typed inside or deleted part of a mention)
            if (editPos >= m.start && editPos <= m.end) return false;
            // If deleting, remove markers in the deleted range
            if (diff < 0 && editPos < m.end && cursorPos > m.start) return false;
            return true;
          })
          .map(m => {
            if (m.start >= editPos) {
              return { ...m, start: m.start + diff, end: m.end + diff };
            }
            return m;
          });
      });
    }

    // Find the word being typed at cursor position
    const textBeforeCursor = value.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setMentionVisible(true);
      setMentionIndex(0);
    } else {
      setMentionVisible(false);
    }
  };

  // Handle mention selection
  const handleMentionSelect = useCallback((userId, username) => {
    const input = inputRef.current;
    if (!input) return;

    const cursorPos = input.selectionStart;
    const textBeforeCursor = newMessage.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex === -1) return;

    const displayText = `@${username}`;
    const before = newMessage.slice(0, atIndex);
    const after = newMessage.slice(cursorPos);
    const newValue = before + displayText + ' ' + after;

    // Create mention marker
    const marker = {
      start: atIndex,
      end: atIndex + displayText.length,
      userId,
      displayText
    };

    // Adjust existing markers that come after the insertion point
    const insertionDiff = (displayText.length + 1) - (cursorPos - atIndex); // +1 for the space
    setMentionMarkers(prev => [
      ...prev
        .map(m => m.start >= atIndex
          ? { ...m, start: m.start + insertionDiff, end: m.end + insertionDiff }
          : m
        ),
      marker
    ]);

    setNewMessage(newValue);
    setMentionVisible(false);
    setMentionQuery('');

    // Restore cursor position after the inserted mention
    setTimeout(() => {
      const newCursorPos = atIndex + displayText.length + 1;
      input.setSelectionRange(newCursorPos, newCursorPos);
      input.focus();
    }, 0);
  }, [newMessage, setNewMessage]);

  // Handle keyboard navigation in mention dropdown
  const handleKeyDown = (e) => {
    if (!mentionVisible) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionIndex(prev => prev + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionIndex(prev => Math.max(0, prev - 1));
    } else if (e.key === 'Enter' && mentionVisible) {
      e.preventDefault();
      // Let autocomplete handle the selection via onSelect
      // We need to trigger it programmatically
      const q = mentionQuery.toLowerCase();
      const everyone = { id: 'everyone', username: 'everyone', isEveryone: true };
      const list = [everyone, ...members]
        .filter(m => (m.username || m.name || '').toLowerCase().includes(q))
        .slice(0, 10);
      
      if (list[mentionIndex]) {
        handleMentionSelect(list[mentionIndex].id, list[mentionIndex].username || list[mentionIndex].name);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setMentionVisible(false);
    }
  };

  // Build raw message and pass to parent on submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Build the raw message with <@userId> tokens
    const rawMessage = buildRawMessage(newMessage, mentionMarkers);
    
    // Temporarily set the raw message for the parent's submit handler
    if (onGetRawMessage) {
      onGetRawMessage(rawMessage);
    }

    // Call parent submit with raw message injected
    const syntheticEvent = {
      preventDefault: () => {},
      _rawMessage: rawMessage
    };
    onSubmit(syntheticEvent);

    // Clear mention markers after sending
    setMentionMarkers([]);
    setMentionVisible(false);
  };

  // Reset markers when message is cleared externally
  useEffect(() => {
    if (newMessage === '') {
      setMentionMarkers([]);
    }
  }, [newMessage]);

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 border-t border-gray-700 relative">
      {/* Reply Preview Bar */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <FiCornerUpLeft className="w-4 h-4 text-stone-500 flex-shrink-0" />
          <div className="flex-1 bg-gray-700/50 border-l-2 border-stone-500 rounded-r-lg px-3 py-1.5 min-w-0">
            <span className="text-xs text-stone-300 font-medium block">Replying to {replyingTo.username}</span>
            <span className="text-xs text-gray-400 truncate block">{replyingTo.text || '[attachment]'}</span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* File Upload Preview */}
      
      <div className="flex gap-1.5 md:gap-2 p-2 md:p-4 items-center">
        <FileUpload 
        ref={fileUploadRef}
        onFilesSelected={onFilesSelected} 
        auth={auth}
        disabled={!currentRoom}
        />
        <EmojiPickerButton onEmojiSelect={handleEmojiInsert} />
        <div className="flex-1 relative">
          <MentionAutocomplete
            members={members}
            query={mentionQuery}
            visible={mentionVisible}
            onSelect={handleMentionSelect}
            onClose={() => setMentionVisible(false)}
            selectedIndex={mentionIndex}
            onChangeIndex={setMentionIndex}
            position={{ bottom: '100%', left: 0 }}
          />
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${currentRoom?.name}`}
            className="w-full px-3 md:px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm md:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-stone-500"
          />
        </div>
        <button
          type="submit"
          disabled={(!newMessage.trim() && selectedFiles.length === 0) || uploadingFiles}
          className="px-3 md:px-6 py-2 bg-stone-700 hover:bg-stone-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm md:text-base"
        >
          {uploadingFiles ? '...' : 'Send'}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;

