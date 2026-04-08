import React from 'react';

/**
 * Shows "X is typing…" / "X and Y are typing…" / "Several people are typing…"
 * below the message list, Discord/Slack style.
 */
const TypingIndicator = ({ typingUsers = [] }) => {
  if (typingUsers.length === 0) return null;

  let text;
  if (typingUsers.length === 1) {
    text = `${typingUsers[0]} is typing`;
  } else if (typingUsers.length === 2) {
    text = `${typingUsers[0]} and ${typingUsers[1]} are typing`;
  } else {
    text = 'Several people are typing';
  }

  return (
    <div className="flex items-center gap-1.5 px-4 py-1 text-xs text-gray-400 h-6 flex-shrink-0">
      {/* Animated dots */}
      <span className="flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </span>
      <span className="truncate">
        <span className="font-medium text-gray-300">{text}</span>…
      </span>
    </div>
  );
};

export default TypingIndicator;
