import React, { useState, useLayoutEffect, useRef, useCallback } from 'react';
import { FiTrash2, FiEdit2, FiCopy, FiCornerUpLeft } from 'react-icons/fi';
import { BsPinAngle } from 'react-icons/bs';

/**
 * Dropdown context menu for a message.
 * Auto-flips to render below when there isn't enough space above.
 */
const MessageContextMenu = ({ msg, isOwn, canModerate, menuRef, onPin, onEdit, onCopy, onReply, onDelete }) => {
  const innerRef = useRef(null);
  const [openAbove, setOpenAbove] = useState(true);

  // Merge the outside-click ref with our measurement ref
  const setRefs = useCallback((node) => {
    innerRef.current = node;
    if (menuRef) menuRef.current = node;
  }, [menuRef]);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // If the menu would go above the viewport, flip it below
    if (rect.top < 0) {
      setOpenAbove(false);
    }
  }, []);

  const menuItems = [
    canModerate && onPin && {
      label: msg.isPinned ? 'Unpin message' : 'Pin message',
      icon: <BsPinAngle className="w-3 h-3" />,
      onClick: () => onPin(msg.id, msg.isPinned),
    },
    isOwn && msg.text && !msg.deletedAt && onEdit && {
      label: 'Edit message',
      icon: <FiEdit2 className="w-3 h-3" />,
      onClick: () => onEdit(msg),
    },
    msg.text && !msg.deletedAt && {
      label: 'Copy text',
      icon: <FiCopy className="w-3 h-3" />,
      onClick: () => onCopy(msg.id, msg.text),
    },
    !msg.deletedAt && {
      label: 'Reply',
      icon: <FiCornerUpLeft className="w-3 h-3" />,
      onClick: () => onReply(msg),
    },
    (canModerate || isOwn) && {
      label: 'Delete message',
      icon: <FiTrash2 className="w-3 h-3" />,
      onClick: () => onDelete(msg.id),
      danger: true,
    },
  ].filter(Boolean);

  const verticalClass = openAbove ? 'bottom-full mb-2' : 'top-full mt-2';

  return (
    <div
      ref={setRefs}
      className={`absolute z-[60] ${verticalClass} ${isOwn ? 'right-0' : 'left-0'} bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-1 min-w-[150px]`}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, idx) => (
        <button
          key={idx}
          onClick={item.onClick}
          className={`w-full px-2.5 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-gray-700 rounded ${
            item.danger ? 'text-red-400' : 'text-gray-200'
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default MessageContextMenu;
