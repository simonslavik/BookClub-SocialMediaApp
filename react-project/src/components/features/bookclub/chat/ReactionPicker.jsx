import React, { useState, useRef, useEffect } from 'react';
import { BsEmojiSmile } from 'react-icons/bs';

const QUICK_EMOJIS = [
  '👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🔥',
  '🎉', '👏', '🤔', '💯', '✅', '❌', '👀', '🙌',
  '💪', '🤝', '📚', '⭐',
];

const ReactionPicker = ({ onSelectEmoji, position = 'top', currentUserEmoji = null, isOwn = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (emoji) => {
    onSelectEmoji(emoji, emoji === currentUserEmoji);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 rounded-lg bg-gray-700/80 hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Add reaction"
      >
        <BsEmojiSmile className="w-3.5 h-3.5 text-gray-300" />
      </button>

      {isOpen && (
        <div
          className={`absolute z-[60] ${
            position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${isOwn ? 'right-0' : 'left-0'} bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-2 w-[240px]`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-5 gap-1">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSelect(emoji)}
                className={`text-xl p-1.5 rounded-lg transition-colors flex items-center justify-center ${
                  emoji === currentUserEmoji
                    ? 'bg-stone-700/40 ring-2 ring-stone-500'
                    : 'hover:bg-gray-700'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReactionPicker;
