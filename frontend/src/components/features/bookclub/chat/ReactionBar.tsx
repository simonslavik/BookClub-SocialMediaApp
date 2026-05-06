import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

/**
 * ReactionBar — displays grouped reactions under a message.
 * Clicking a chip opens a modal showing who reacted with each emoji.
 *
 * Props:
 *  - reactions: Array<{ emoji, count, userIds }> — grouped reactions from backend
 *  - currentUserId: string — the logged-in user's ID
 *  - onToggleReaction: (emoji: string, hasReacted: boolean) => void
 *  - members: Array<{ id, username?, name? }> — optional member list for name resolution
 */
const ReactionBar = ({ reactions, currentUserId, onToggleReaction, members = [], isOwn = true }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeEmoji, setActiveEmoji] = useState(null);

  if (!reactions || reactions.length === 0) return null;

  // Build a lookup map: userId -> display name
  const nameMap = {};
  for (const m of members) {
    if (m.id) nameMap[m.id] = m.username || m.name || 'Unknown';
  }
  const resolveName = (userId) => {
    if (userId === currentUserId) return 'You';
    return nameMap[userId] || 'Unknown User';
  };

  const openModal = (emoji) => {
    setActiveEmoji(emoji);
    setModalOpen(true);
  };

  const selectedReactions = activeEmoji
    ? reactions.filter((r) => r.emoji === activeEmoji)
    : reactions;

  return (
    <>
      <div className={`flex flex-wrap mt-[-10px] z-50 ${isOwn ? 'justify-end' : 'justify-start  relative '}`}>
        {reactions.map(({ emoji, count, userIds }) => {
          const hasReacted = userIds.includes(currentUserId);

          return (
            <button
              key={emoji}
              onClick={(e) => {
                e.stopPropagation();
                openModal(emoji);
              }}
              className={`inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full text-[10px] transition-all border ${
                hasReacted
                  ? 'bg-indigo-700/30 border-indigo-500 text-indigo-200 hover:bg-indigo-700/40'
                  : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
              title={`${emoji} ${count}`}
            >
              <span className="text-xs">{emoji}</span>
              <span className="font-medium">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Reactions detail modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-72 max-h-[360px] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
              <h3 className="text-xs font-semibold text-white">Reactions</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-0.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Emoji tabs */}
            <div className="flex gap-1 px-3 py-1.5 border-b border-gray-700 overflow-x-auto">
              <button
                onClick={() => setActiveEmoji(null)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors flex-shrink-0 ${
                  !activeEmoji
                    ? 'bg-indigo-700 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All {reactions.reduce((s, r) => s + r.count, 0)}
              </button>
              {reactions.map(({ emoji, count }) => (
                <button
                  key={emoji}
                  onClick={() => setActiveEmoji(emoji)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors flex-shrink-0 ${
                    activeEmoji === emoji
                      ? 'bg-indigo-700 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {emoji} {count}
                </button>
              ))}
            </div>

            {/* User list */}
            <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-0.5">
              {selectedReactions.map(({ emoji, userIds }) =>
                userIds.map((uid) => (
                  <div
                    key={`${emoji}-${uid}`}
                    className="flex items-center justify-between py-1 px-2 rounded hover:bg-gray-700/50"
                  >
                    <span className="text-xs text-gray-200">{resolveName(uid)}</span>
                    <span className="text-sm">{emoji}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReactionBar;
