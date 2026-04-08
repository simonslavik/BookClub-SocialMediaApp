import React from 'react';
import { FiHash, FiSettings, FiCalendar, FiUserPlus, FiVideo } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import logger from '@utils/logger';

const BookclubHeader = ({ 
  showBooksHistory, 
  showCalendar, 
  showSuggestions,
  showMeetings,
  showSettings,
  currentRoom,
  auth,
  onInviteClick,
  onSettingsClick,
  userRole
}) => {
  
  return (
    <div className="bg-gray-800 border-b border-gray-700 px-3 md:px-4 py-2 md:py-3 flex items-center justify-between min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        {showBooksHistory ? (
          <h2 className="text-white font-semibold text-sm md:text-base truncate">Books History</h2>
        ) : showCalendar ? (
          <>
            <FiCalendar className="text-gray-400 flex-shrink-0" />
            <h2 className="text-white font-semibold text-sm md:text-base truncate">Calendar</h2>
          </>
        ) : showSuggestions ? (
          <h2 className="text-white font-semibold text-sm md:text-base truncate">Suggestions & Voting</h2>
        ) : showMeetings ? (
          <>
            <FiVideo className="text-stone-500 flex-shrink-0" />
            <h2 className="text-white font-semibold text-sm md:text-base truncate">Meetings</h2>
          </>
        ) : (
          <>
            <FiHash className="text-gray-400 flex-shrink-0" />
            <h2 className="text-white font-semibold text-sm md:text-base truncate">{currentRoom?.name}</h2>
          </>
        )}
      </div>
      <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
        {auth?.user && (
          <button 
            onClick={onInviteClick}
            className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 bg-stone-700 hover:bg-stone-800 text-white rounded-lg transition-colors text-sm font-medium"
            title="Invite people"
          >
            <FiUserPlus size={18} />
            <span className="hidden sm:inline">Invite</span>
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
