import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsPinAngle } from 'react-icons/bs';
import MessageAttachment from '../../../common/MessageAttachment';
import ReactionBar from './ReactionBar';
import ReplyPreview from './ReplyPreview';
import MessageActions from './MessageActions';
import { getProfileImageUrl } from '@config/constants';
import { renderMessageContent, formatTimestamp } from './messageUtils';
import UserHoverCard from '../UserHoverCard';

/**
 * Renders a message sent by another user (left-aligned with avatar).
 */
const OtherMessage = ({
  msg, auth, members, canModerate,
  isLastInGroup, copiedMessageId,
  // actions
  isMenuOpen, menuRef,
  onToggleReaction, onToggleMenu,
  onPin, onCopy, onReply, onDelete,
  onScrollToMessage, getUserReactionEmoji,
  friends = [], onSendFriendRequest, connectedUsers = [],
}) => {
  const [showFullDate, setShowFullDate] = useState(false);
  const navigate = useNavigate();

  const isFriend = friends.some(f => f.friend?.id === msg.userId);
  const isOnline = connectedUsers.some(cu => cu.userId === msg.userId);

  const hoverUser = {
    id: msg.userId,
    username: msg.username,
    profileImage: msg.profileImage,
    status: msg.status,
  };

  return (
    <div className="flex gap-1 group">
      <UserHoverCard
        user={hoverUser}
        currentUserId={auth?.user?.id}
        isFriend={isFriend}
        isOnline={isOnline}
        onSendFriendRequest={onSendFriendRequest}
        className="flex-shrink-0 self-end"
      >
        <img
          src={getProfileImageUrl(msg.profileImage) || '/images/default.webp'}
          alt={msg.username}
          className="w-7 h-7 rounded-[50%] object-cover cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all"
          onClick={() => msg.userId && navigate(`/profile/${msg.userId}`)}
          onError={(e) => { e.target.src = '/images/default.webp'; }}
        />
      </UserHoverCard>
      <div className="max-w-md w-fit">
        {/* Username + Pinned badge */}
        <div className="flex items-baseline">
          <span
            className="text-gray-400 text-xs font-light cursor-pointer hover:text-purple-400 hover:underline transition-colors"
            onClick={() => msg.userId && navigate(`/profile/${msg.userId}`)}
          >{msg.username}</span>
          {msg.isPinned && (
            <span className="flex items-center gap-1 text-xs text-yellow-400">
              <BsPinAngle className="w-3 h-3" />
              Pinned
            </span>
          )}
        </div>

        {/* Reply quote */}
        <ReplyPreview replyTo={msg.replyTo} onScrollTo={onScrollToMessage} />

        {/* Message bubble */}
        <div className="relative">
        <div
          onClick={() => setShowFullDate((v) => !v)}
          className="relative w-fit bg-gray-800 rounded-2xl px-2 py-3 shadow-md cursor-pointer hover:bg-gray-750 transition-colors"
        >
          {msg.text && (
            <p className={`text-sm text-gray-200 break-words leading-relaxed ${msg.deletedAt ? 'italic text-gray-500' : ''}`}>
              {renderMessageContent(msg.text, members, auth?.user?.id, { friends, connectedUsers, onSendFriendRequest })}
              {msg.editedAt && <span className="text-xs text-gray-500 italic ml-1">(edited)</span>}
            </p>
          )}
          {msg.attachments?.length > 0 && !msg.deletedAt && (
            <div className="flex flex-col gap-2 mt-2">
              {msg.attachments.map((att) => (
                <MessageAttachment key={att.id} attachment={att} canDelete={false} auth={auth} />
              ))}
            </div>
          )}
          {copiedMessageId === msg.id && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
              Copied!
            </div>
          )}
          {/* Floating actions (reaction picker + menu) */}
          <MessageActions
            msg={msg}
            isOwn={false}
            canModerate={canModerate}
            currentUserEmoji={getUserReactionEmoji(msg.reactions)}
            isMenuOpen={isMenuOpen}
            menuRef={menuRef}
            onToggleReaction={onToggleReaction}
            onToggleMenu={onToggleMenu}
            onPin={onPin}
            onCopy={onCopy}
            onReply={onReply}
            onDelete={onDelete}
            position="right"
          />
        </div>
        </div>

        {/* Reactions */}
        <ReactionBar
          reactions={msg.reactions}
          currentUserId={auth?.user?.id}
          onToggleReaction={(emoji, hasReacted) => onToggleReaction(msg.id, emoji, hasReacted)}
          members={members}
          isOwn={false}
        />

        {/* Timestamp */}
        {isLastInGroup && showFullDate && (
          <span className="text-xs text-gray-500 block ">
            {new Date(msg.timestamp).toLocaleString()}
          </span>
        )}
        {isLastInGroup && !showFullDate && (
          <span className="text-xs text-gray-500 block">
            {formatTimestamp(msg.timestamp)}
          </span>
        )}

      </div>
    </div>
  );
};

export default OtherMessage;
