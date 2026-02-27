

import React, { useState, useRef, useEffect } from 'react';
import { FiHome, FiPlus, FiHash, FiMail, FiBook, FiCalendar, FiLock, FiVolume2, FiSettings, FiUsers, FiMoreVertical, FiVideo } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import BookClubImage from './BookClubImage';
import logger from '@utils/logger';

const getRoomIcon = (room) => {
  switch (room.type) {
    case 'PRIVATE': return FiLock;
    case 'ANNOUNCEMENT': return FiVolume2;
    default: return FiHash;
  }
};

const getRoomIconColor = (room, isActive) => {
  if (isActive) return 'text-white';
  switch (room.type) {
    case 'PRIVATE': return 'text-yellow-400';
    case 'ANNOUNCEMENT': return 'text-blue-400';
    default: return '';
  }
};

const RoomContextMenu = ({ room, position, onClose, onOpenSettings, userRole }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const canManage = ['OWNER', 'ADMIN', 'MODERATOR'].includes(userRole);
  if (!canManage) return null;

  return (
    <div
      ref={menuRef}
      className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 z-50 min-w-[160px]"
      style={{ top: position.y, left: position.x }}
    >
      <button
        onClick={() => { onOpenSettings(room); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
      >
        <FiSettings size={14} />
        Room Settings
      </button>
    </div>
  );
};




const SideBarRooms = ({
    bookClub,
    rooms,
    currentRoom,
    switchRoom,
    handleCreateRoom,
    onOpenRoomSettings,
    auth,
    userRole,
    uploadingImage,
    fileInputRef,
    handleImageUpload,
    handleDeleteImage,
    onOpenDM,
    setAddCurrentBookState,
    addCurrentBookState,
    onCurrentBookClick,
    onShowBooksHistory,
    setShowBooksHistory,
    showBooksHistory,
    onShowCalendar,
    showCalendar,
    onShowSuggestions,
    showSuggestions,
    onShowMeetings,
    showMeetings
}) => {
    const navigate = useNavigate();
    const [contextMenu, setContextMenu] = useState(null);

    const handleContextMenu = (e, room) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ room, position: { x: e.clientX, y: e.clientY } });
    };

    const canCreateRoom = ['OWNER', 'ADMIN', 'MODERATOR'].includes(userRole);

    if (!bookClub) {
        return (
            <div className="w-64 bg-gray-800 border-r border-gray-700 flex items-center justify-center h-full">
                <p className="text-gray-400">Loading...</p>
            </div>
        );
    }

    return (
          <>
          <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-full  overflow-y-auto">
            {/* Bookclub Header with Image */}
            <div className="p-4 border-b border-gray-700 flex-shrink-0">
              {/* Bookclub Image */}
              <BookClubImage 
                bookClub={bookClub} 
                auth={auth} 
                uploadingImage={uploadingImage} 
                fileInputRef={fileInputRef} 
                handleImageUpload={handleImageUpload} 
                handleDeleteImage={handleDeleteImage}
              />
              
              <h2 
                className="text-white font-bold text-lg truncate cursor-pointer hover:text-purple-400"
                onClick={() => navigate(`/bookclubpage/${bookClub?.id}`)}
              >
                {bookClub?.name}
              </h2>
            </div>

            {/* Book Suggestions Button */}
            <div className='border-b border-gray-700 p-4 flex-shrink-0'>
              <button
                onClick={() => onShowSuggestions && onShowSuggestions()}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded transition-colors text-sm ${
                  showSuggestions 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                <span className="text-lg">📚</span>
                Book Suggestions
              </button>
            </div>
            
            {/* Books History Button */}
            <div className='border-b border-gray-700 p-4 flex-shrink-0'>
              <button
                onClick={() => onShowBooksHistory && onShowBooksHistory()}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded transition-colors text-sm ${
                  showBooksHistory 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                <FiBook size={14} />
                BookClub Books
              </button>
            </div>

            {/* Calendar Button */}
            <div className='border-b border-gray-700 p-4 flex-shrink-0 space-y-2'>
              <button
                onClick={() => onShowCalendar && onShowCalendar()}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded transition-colors text-sm ${
                  showCalendar 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                <FiCalendar size={14} />
                BookClub Calendar
              </button>
              <button
                onClick={() => onShowMeetings && onShowMeetings()}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded transition-colors text-sm ${
                  showMeetings 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                <FiVideo size={14} />
                Meetings
              </button>
            </div>

            {/* Rooms List */}
            <div className="flex-1">
              <div className="p-2">
                <div className="flex items-center justify-between px-2 py-1 mb-2">
                  <h3 className="text-gray-400 text-xs font-semibold uppercase">Rooms</h3>
                  {canCreateRoom && (
                    <button 
                      onClick={handleCreateRoom}
                      className="text-gray-400 hover:text-white"
                      title="Create Room"
                    >
                      <FiPlus size={14} />
                    </button>
                  )}
                </div>
                
                {rooms.map(room => {
                  const Icon = getRoomIcon(room);
                  const isActive = currentRoom?.id === room.id && !showBooksHistory && !showCalendar && !showSuggestions && !showMeetings;
                  const iconColor = getRoomIconColor(room, isActive);
                  const isLocked = room.type === 'PRIVATE' && room.isMember === false;
                  return (
                    <div
                      key={room.id}
                      className="group relative"
                      onContextMenu={(e) => !isLocked && handleContextMenu(e, room)}
                    >
                      <button
                        onClick={() => !isLocked && switchRoom(room)}
                        disabled={isLocked}
                        title={isLocked ? 'You do not have access to this private room' : room.name}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                          isLocked
                            ? 'text-gray-600 cursor-not-allowed opacity-60'
                            : isActive
                              ? 'bg-gray-700 text-white'
                              : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <Icon size={16} className={`flex-shrink-0 ${isLocked ? 'text-gray-600' : iconColor}`} />
                        <span className="truncate flex-1">{room.name}</span>
                        {room.type === 'PRIVATE' && room._count?.members > 0 && (
                          <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                            <FiUsers size={10} /> {room._count.members}
                          </span>
                        )}
                      </button>
                      {/* Three-dot menu on hover (for mods+) */}
                      {['OWNER', 'ADMIN', 'MODERATOR'].includes(userRole) && (
                        <button
                          onClick={(e) => handleContextMenu(e, room)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiMoreVertical size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
              <RoomContextMenu
                room={contextMenu.room}
                position={contextMenu.position}
                onClose={() => setContextMenu(null)}
                onOpenSettings={onOpenRoomSettings}
                userRole={userRole}
              />
            )}
          </div>
          </>
    );
};

export default SideBarRooms;