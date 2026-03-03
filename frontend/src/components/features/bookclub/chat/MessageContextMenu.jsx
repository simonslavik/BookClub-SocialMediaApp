import React from 'react';
import { FiTrash2, FiEdit2, FiCopy, FiCornerUpLeft } from 'react-icons/fi';
import { BsPinAngle } from 'react-icons/bs';

/**
 * Dropdown context menu for a message.
 *
 * Props:
 *  - msg           — the message object
 *  - isOwn         — whether the current user sent this message
 *  - canModerate   — whether the user has moderation permissions
 *  - menuRef       — ref for outside-click detection
 *  - onPin, onEdit, onCopy, onReply, onDelete — action callbacks
 */
const MessageContextMenu = ({ msg, isOwn, canModerate, menuRef, onPin, onEdit, onCopy, onReply, onDelete }) => {
  const menuItems = [
    canModerate && onPin && {
      label: msg.isPinned ? 'Unpin message' : 'Pin message',
      icon: <BsPinAngle className="w-4 h-4" />,
      onClick: () => onPin(msg.id, msg.isPinned),
    },
    isOwn && msg.text && !msg.deletedAt && onEdit && {
      label: 'Edit message',
      icon: <FiEdit2 className="w-4 h-4" />,
      onClick: () => onEdit(msg),
    },
    msg.text && !msg.deletedAt && {
      label: 'Copy text',
      icon: <FiCopy className="w-4 h-4" />,
      onClick: () => onCopy(msg.id, msg.text),
    },
    !msg.deletedAt && {
      label: 'Reply',
      icon: <FiCornerUpLeft className="w-4 h-4" />,
      onClick: () => onReply(msg),
    },
    (canModerate || isOwn) && {
      label: 'Delete message',
      icon: <FiTrash2 className="w-4 h-4" />,
      onClick: () => onDelete(msg.id),
      danger: true,
    },
  ].filter(Boolean);

  return (
    <div
      ref={menuRef}
      className={`absolute z-[60] bottom-full mb-2 ${isOwn ? 'right-0' : 'left-0'} bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-2 min-w-[180px]`}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, idx) => (
        <button
          key={idx}
          onClick={item.onClick}
          className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-700 ${
            idx === 0 ? 'rounded-t-lg' : ''
          } ${idx === menuItems.length - 1 ? 'rounded-b-lg' : ''} ${
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
