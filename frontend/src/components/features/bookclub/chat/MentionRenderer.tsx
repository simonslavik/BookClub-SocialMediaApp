import React from 'react';

/**
 * MentionRenderer
 * 
 * Parses message content containing <@userId> or <@everyone> tokens
 * and renders them as styled mention badges.
 * 
 * Props:
 * - content: The raw message content string with <@userId> tokens
 * - members: Array of member objects with { id, username }
 * - currentUserId: The current logged-in user's ID
 */

const MentionBadge = ({ label, isHighlighted }) => (
  <span
    className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold cursor-default ${
      isHighlighted
        ? 'bg-yellow-500/30 text-yellow-200 ring-1 ring-yellow-500/50'
        : 'bg-indigo-500/30 text-indigo-200 ring-1 ring-indigo-500/50'
    }`}
  >
    @{label}
  </span>
);

const MentionRenderer = ({ content, members = [], currentUserId }) => {
  if (!content || typeof content !== 'string') return null;

  // Split content by mention tokens: <@userId> or <@everyone>
  const mentionRegex = /(<@[a-zA-Z0-9_-]+>|<@everyone>)/g;
  const parts = content.split(mentionRegex);

  if (parts.length === 1) {
    // No mentions found, return plain text
    return <>{content}</>;
  }

  // Build a lookup map for quick userId → username resolution
  const memberMap = {};
  for (const m of members) {
    if (m.id) memberMap[m.id] = m.username || m.name || 'Unknown';
  }

  return (
    <>
      {parts.map((part, index) => {
        // Check if this part is a mention token
        if (part === '<@everyone>') {
          return (
            <MentionBadge
              key={index}
              label="everyone"
              isHighlighted={true}
            />
          );
        }

        const userMentionMatch = part.match(/^<@([a-zA-Z0-9_-]+)>$/);
        if (userMentionMatch) {
          const mentionedUserId = userMentionMatch[1];
          const username = memberMap[mentionedUserId] || 'Unknown User';
          const isSelf = mentionedUserId === currentUserId;

          return (
            <MentionBadge
              key={index}
              label={username}
              isHighlighted={isSelf}
            />
          );
        }

        // Regular text
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
};

export default MentionRenderer;
