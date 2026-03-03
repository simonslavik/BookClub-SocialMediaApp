import React from 'react';
import { FiMoreVertical } from 'react-icons/fi';
import ReactionPicker from './ReactionPicker';
import MessageContextMenu from './MessageContextMenu';

/**
 * Floating action bar (reaction picker + context-menu button) for a message.
 *
 * Props:
 *  - msg, isOwn, canModerate    — message data + permissions
 *  - currentUserEmoji           — emoji the current user already reacted with (or null)
 *  - isMenuOpen                 — whether this message's context menu is open
 *  - menuRef                    — ref for outside-click detection
 *  - onToggleReaction           — (messageId, emoji, hasReacted) => void
 *  - onToggleMenu               — (messageId, event) => void
 *  - onPin, onEdit, onCopy, onReply, onDelete — forwarded to MessageContextMenu
 *  - position                   — 'left' | 'right'  (controls where the bar floats)
 */
const MessageActions = ({
  msg, isOwn, canModerate,
  currentUserEmoji, isMenuOpen, menuRef,
  onToggleReaction, onToggleMenu,
  onPin, onEdit, onCopy, onReply, onDelete,
  position = 'left',
}) => {
  if (msg.deletedAt) return null;

  const positionClass = position === 'left'
    ? 'absolute -left-12 top-1/2 -translate-y-1/2'
    : 'absolute top-1/2 -translate-y-1/2 -right-12';

  return (
    <div className={`${positionClass} flex items-center gap-0.5`}>
      <ReactionPicker
        onSelectEmoji={(emoji, isAlreadySelected) => onToggleReaction(msg.id, emoji, isAlreadySelected)}
        position="top"
        currentUserEmoji={currentUserEmoji}
        isOwn={isOwn}
      />
      <div className="relative">
          <button
            onClick={(e) => onToggleMenu(msg.id, e)}
            className="p-1 rounded-lg bg-gray-700/80 hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <FiMoreVertical className="w-3.5 h-3.5 text-gray-300" />
          </button>
          {isMenuOpen && (
            <MessageContextMenu
              msg={msg}
              isOwn={isOwn}
              canModerate={canModerate}
              menuRef={menuRef}
              onPin={onPin}
              onEdit={onEdit}
              onCopy={onCopy}
              onReply={onReply}
              onDelete={onDelete}
            />
          )}
        </div>
    </div>
  );
};

export default MessageActions;
