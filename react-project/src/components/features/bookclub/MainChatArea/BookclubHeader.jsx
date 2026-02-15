import React from 'react';
import { FiHash, FiSettings, FiCalendar, FiUserPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import logger from '@utils/logger';

const BookclubHeader = ({ 
  showBooksHistory, 
  showCalendar, 
  showSuggestions,
  showSettings,
  currentRoom,
  auth,
  onInviteClick,
  onSettingsClick,
  userRole
}) => {
  
  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {showBooksHistory ? (
          <h2 className="text-white font-semibold">BookClub Books History</h2>
        ) : showCalendar ? (
          <>
            <FiCalendar className="text-gray-400" />
            <h2 className="text-white font-semibold">BookClub Calendar</h2>
          </>
        ) : showSuggestions ? (
          <h2 className="text-white font-semibold">Book Suggestions & Voting</h2>
        ) : (
          <>
            <FiHash className="text-gray-400" />
            <h2 className="text-white font-semibold">{currentRoom?.name}</h2>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {auth?.user && (
          <button 
            onClick={onInviteClick}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
            title="Invite people"
          >
            <FiUserPlus size={18} />
            Invite
          </button>
        )}
        {auth?.user && !showSettings && (userRole === 'OWNER' || userRole === 'ADMIN') && (
          <button 
            onClick={onSettingsClick}
            className="text-gray-400 hover:text-white transition-colors"
            title="Bookclub Settings"
          >
            <FiSettings size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default BookclubHeader;
