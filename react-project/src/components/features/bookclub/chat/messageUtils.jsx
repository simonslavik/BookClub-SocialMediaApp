import React from 'react';
import UserHoverCard from '../UserHoverCard';

/**
 * Convert URLs in text to clickable links.
 */
export const linkifyText = (text) => {
  if (!text || typeof text !== 'string') return text;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-300"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

/**
 * Smart timestamp: time only for today, date+time otherwise.
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const messageDate = new Date(timestamp);
  if (isNaN(messageDate.getTime())) return '';
  const today = new Date();
  const isToday = messageDate.toDateString() === today.toDateString();

  if (isToday) {
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return `${messageDate.toLocaleDateString()} ${messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

/**
 * Render text with @mention tokens and linkified URLs.
 */
export const MentionRendererWithLinks = ({ content, members, currentUserId, hoverContext }) => {
  if (!content || typeof content !== 'string') return null;

  const mentionRegex = /(<@[a-zA-Z0-9_-]+>|<@everyone>)/g;
  const parts = content.split(mentionRegex);

  if (parts.length === 1) return <>{linkifyText(content)}</>;

  const memberMap = {};
  for (const m of members) {
    if (m.id) memberMap[m.id] = m;
  }

  return (
    <>
      {parts.map((part, index) => {
        if (part === '<@everyone>') {
          return (
            <span
              key={index}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-yellow-500/30 text-yellow-200 ring-1 ring-yellow-500/50"
            >
              @everyone
            </span>
          );
        }
        const match = part.match(/^<@([a-zA-Z0-9_-]+)>$/);
        if (match) {
          const uid = match[1];
          const member = memberMap[uid];
          const name = member?.username || member?.name || 'Unknown User';
          const isSelf = uid === currentUserId;

          const mentionEl = (
            <a
              key={index}
              href={`/profile/${uid}`}
              onClick={(e) => { e.stopPropagation(); }}
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold cursor-pointer hover:brightness-125 transition-all no-underline ${
                isSelf
                  ? 'bg-yellow-500/30 text-yellow-200 ring-1 ring-yellow-500/50'
                  : 'bg-indigo-500/30 text-indigo-200 ring-1 ring-indigo-500/50'
              }`}
            >
              @{name}
            </a>
          );

          // Wrap non-self mentions in UserHoverCard if context provided
          if (!isSelf && hoverContext && member) {
            const { friends = [], connectedUsers = [], onSendFriendRequest } = hoverContext;
            const isFriend = friends.some(f => f.friend?.id === uid);
            const isOnline = connectedUsers.some(cu => cu.userId === uid);
            return (
              <UserHoverCard
                key={index}
                user={{
                  id: uid,
                  username: name,
                  profileImage: member.profileImage,
                  status: member.status,
                }}
                currentUserId={currentUserId}
                isFriend={isFriend}
                isOnline={isOnline}
                onSendFriendRequest={onSendFriendRequest}
              >
                {mentionEl}
              </UserHoverCard>
            );
          }

          return mentionEl;
        }
        return <React.Fragment key={index}>{linkifyText(part)}</React.Fragment>;
      })}
    </>
  );
};

/**
 * Determine if consecutive messages should be visually grouped.
 * Returns { groupWithPrevious, isLastInGroup }.
 */
export const shouldGroupMessages = (currentMsg, previousMsg, nextMsg) => {
  const FIVE_MINUTES = 300000;
  if (!currentMsg) return { groupWithPrevious: false, isLastInGroup: true };

  if (!previousMsg) {
    let isLastInGroup = true;
    if (nextMsg && nextMsg.type !== 'system' && nextMsg.userId === currentMsg.userId) {
      isLastInGroup = new Date(nextMsg.timestamp) - new Date(currentMsg.timestamp) > FIVE_MINUTES;
    }
    return { groupWithPrevious: false, isLastInGroup };
  }

  if (currentMsg.type === 'system' || previousMsg.type === 'system') {
    return { groupWithPrevious: false, isLastInGroup: !nextMsg || nextMsg.userId !== currentMsg.userId };
  }

  if (currentMsg.userId !== previousMsg.userId) {
    return { groupWithPrevious: false, isLastInGroup: !nextMsg || nextMsg.userId !== currentMsg.userId };
  }

  const timeDiff = new Date(currentMsg.timestamp) - new Date(previousMsg.timestamp);
  const groupWithPrevious = timeDiff <= FIVE_MINUTES;

  let isLastInGroup = true;
  if (nextMsg && nextMsg.userId === currentMsg.userId) {
    isLastInGroup = new Date(nextMsg.timestamp) - new Date(currentMsg.timestamp) > FIVE_MINUTES;
  }

  return { groupWithPrevious, isLastInGroup };
};

/**
 * Render message content with mentions + links.
 */
export const renderMessageContent = (text, members, currentUserId, hoverContext) => {
  if (!text) return '';
  const hasMentions = /<@[a-zA-Z0-9_-]+>/.test(text) || text.includes('<@everyone>');
  if (hasMentions) {
    return <MentionRendererWithLinks content={text} members={members} currentUserId={currentUserId} hoverContext={hoverContext} />;
  }
  return linkifyText(text);
};
