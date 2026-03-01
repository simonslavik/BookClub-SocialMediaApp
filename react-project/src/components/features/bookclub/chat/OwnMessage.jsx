import React from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import { BsPinAngle } from 'react-icons/bs';
import MessageAttachment from '../../../common/MessageAttachment';
import ReactionBar from './ReactionBar';
import ReplyPreview from './ReplyPreview';
import MessageActions from './MessageActions';
import { renderMessageContent, formatTimestamp } from './messageUtils';

/**
 * Renders a message sent by the current user (right-aligned bubble).
 */
const OwnMessage = ({
  msg, auth, members, canModerate,
  isLastInGroup, copiedMessageId,
  // editing
  editingMessageId, editingText, setEditingText, editInputRef,
  onEditKeyDown, onEditSave, onCancelEdit,
  // actions
  isMenuOpen, menuRef,
  onToggleReaction, onToggleMenu,
  onPin, onEdit, onCopy, onReply, onDelete,
  onScrollToMessage, getUserReactionEmoji,
  friends = [], onSendFriendRequest, connectedUsers = [],
}) => {
  const isEditing = editingMessageId === msg.id;

  return (
    <div className="flex gap-1 justify-end group">
      <div className="text-right max-w-md w-fit self-end">
        {/* Pinned badge */}
        {msg.isPinned && (
          <div className="flex items-center justify-end gap-1 text-xs text-yellow-400 mb-1">
            <BsPinAngle className="w-3 h-3" />
            <span>Pinned</span>
          </div>
        )}

        {/* Reply quote */}
        <ReplyPreview replyTo={msg.replyTo} onScrollTo={onScrollToMessage} alignRight />

        <div className="relative">
        {/* Message body */}
        {isEditing ? (
          <div className="bg-gray-800 rounded-2xl px-2 py-3 shadow-lg mb-1 border border-purple-500">
            <textarea
              ref={editInputRef}
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              onKeyDown={(e) => onEditKeyDown(e, msg.id)}
              className="w-full bg-transparent text-white resize-none outline-none min-h-[40px] max-h-[120px]"
              rows={1}
            />
            <div className="flex items-center justify-end gap-2 mt-2 text-xs">
              <button onClick={onCancelEdit} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 flex items-center gap-1">
                <FiX className="w-3 h-3" /> Cancel
              </button>
              <button onClick={() => onEditSave(msg.id)} className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1">
                <FiCheck className="w-3 h-3" /> Save
              </button>
            </div>
          </div>
        ) : msg.text && (
          <div className={`relative w-fit bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl px-2 py-3 shadow-lg mb-1 ml-auto ${msg.deletedAt ? 'opacity-60 italic' : ''}`}>
            <p className="text-sm text-white break-words font-medium">
              {renderMessageContent(msg.text, members, auth?.user?.id, { friends, connectedUsers, onSendFriendRequest })}
              {msg.editedAt && <span className="text-xs text-purple-200 italic ml-1">(edited)</span>}
            </p>
            {copiedMessageId === msg.id && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                Copied!
              </div>
            )}
          </div>
        )}

        {/* Attachments */}
        {msg.attachments?.length > 0 && !msg.deletedAt && (
          <div className="flex flex-col gap-2 mb-1">
            {msg.attachments.map((att) => (
              <MessageAttachment key={att.id} attachment={att} canDelete={false} auth={auth} />
            ))}
          </div>
        )}

        {/* Floating actions (reaction picker + menu) */}
        <MessageActions
          msg={msg}
          isOwn
          canModerate={canModerate}
          currentUserEmoji={getUserReactionEmoji(msg.reactions)}
          isMenuOpen={isMenuOpen}
          menuRef={menuRef}
          onToggleReaction={onToggleReaction}
          onToggleMenu={onToggleMenu}
          onPin={onPin}
          onEdit={onEdit}
          onCopy={onCopy}
          onReply={onReply}
          onDelete={onDelete}
          position="left"
        />
        </div>

        {/* Reactions */}
        <div className="flex justify-end">
          <ReactionBar
            reactions={msg.reactions}
            currentUserId={auth?.user?.id}
            onToggleReaction={(emoji, hasReacted) => onToggleReaction(msg.id, emoji, hasReacted)}
            members={members}
          />
        </div>

        {/* Timestamp */}
        {isLastInGroup && (
          <span className="text-xs text-gray-500 block text-right">
            {formatTimestamp(msg.timestamp)}
          </span>
        )}
      </div>
    </div>
  );
};

export default OwnMessage;
