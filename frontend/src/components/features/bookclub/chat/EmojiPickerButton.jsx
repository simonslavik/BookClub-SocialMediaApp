import React, { useState, useRef, useEffect } from 'react';
import { BsEmojiSmile } from 'react-icons/bs';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

/**
 * EmojiPickerButton — a button that opens a full emoji picker (emoji-mart).
 * Inserts the selected emoji into the message text at the cursor position.
 *
 * Props:
 *  - onEmojiSelect: (emoji: string) => void — called with the emoji native character
 */
const EmojiPickerButton = ({ onEmojiSelect }) => {
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

  const handleSelect = (emojiData) => {
    onEmojiSelect(emojiData.native);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-700 transition-colors"
        title="Add emoji"
      >
        <BsEmojiSmile className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 z-[70]">
          <Picker
            data={data}
            onEmojiSelect={handleSelect}
            theme="dark"
            previewPosition="none"
            skinTonePosition="none"
            maxFrequentRows={2}
            perLine={8}
          />
        </div>
      )}
    </div>
  );
};

export default EmojiPickerButton;
