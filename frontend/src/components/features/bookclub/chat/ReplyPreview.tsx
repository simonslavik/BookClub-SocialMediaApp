import React from 'react';

/**
 * Quoted reply block shown above a message bubble.
 *
 * Props:
 *  - replyTo     — { id, username, content }
 *  - onScrollTo  — (messageId) => void
 *  - alignRight  — whether to right-align (own messages)
 */
const ReplyPreview = ({ replyTo, onScrollTo, alignRight = false }) => {
  if (!replyTo) return null;

  return (
    <div
      onClick={() => onScrollTo(replyTo.id)}
      className={`mb-1 cursor-pointer ${alignRight ? 'flex items-center justify-end gap-1' : ''}`}
    >
      <div className={`${
        alignRight
          ? 'bg-indigo-950/40 border-l-2 border-indigo-500 rounded-r-lg'
          : 'bg-gray-700/50 border-l-2 border-indigo-500 rounded-r-lg'
      } px-3 py-1.5 max-w-[280px] hover:bg-indigo-950/60 transition-colors`}>
        <span className="text-xs text-indigo-300 font-medium block">{replyTo.username}</span>
        <span className="text-xs text-gray-400 truncate block">{replyTo.content || '[attachment]'}</span>
      </div>
    </div>
  );
};

export default ReplyPreview;
