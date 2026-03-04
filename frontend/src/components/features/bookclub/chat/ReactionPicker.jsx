import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { BsEmojiSmile } from 'react-icons/bs';

const QUICK_EMOJIS = [
  '👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🔥',
  '🎉', '👏', '🤔', '💯', '✅', '❌', '👀', '🙌',
  '💪', '🤝', '📚', '⭐',
];

const ReactionPicker = ({ onSelectEmoji, position = 'top', currentUserEmoji = null, isOwn = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(position === 'top');
  const pickerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-flip: measure after open, reposition if clipped
  useLayoutEffect(() => {
    if (!isOpen || !dropdownRef.current) return;
    const rect = dropdownRef.current.getBoundingClientRect();
    if (rect.top < 0) {
      setOpenAbove(false);
    } else if (rect.bottom > window.innerHeight) {
      setOpenAbove(true);
    }
  }, [isOpen]);

  const handleSelect = (emoji) => {
    onSelectEmoji(emoji, emoji === currentUserEmoji);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!isOpen) setOpenAbove(position === 'top');
          setIsOpen(!isOpen);
        }}
        className="p-1 rounded-lg bg-gray-700/80 hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Add reaction"
      >
        <BsEmojiSmile className="w-3.5 h-3.5 text-gray-300" />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute z-[60] ${
            openAbove ? 'bottom-full mb-2' : 'top-full mt-2'
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
