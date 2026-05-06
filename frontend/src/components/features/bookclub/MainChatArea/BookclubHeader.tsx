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
  userRole,
  pendingRequestsCount = 0,
}) => {
  
  return (
    <div className="bg-gray-800 border-b border-gray-700 px-3 py-2 flex items-center justify-between min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        {showBooksHistory ? (
          <h2 className="text-white font-semibold text-sm truncate">Books History</h2>
        ) : showCalendar ? (
          <>
            <FiCalendar className="text-gray-400 flex-shrink-0" size={14} />
            <h2 className="text-white font-semibold text-sm truncate">Calendar</h2>
          </>
        ) : showSuggestions ? (
          <h2 className="text-white font-semibold text-sm truncate">Suggestions & Voting</h2>
        ) : showMeetings ? (
          <>
            <FiVideo className="text-indigo-500 flex-shrink-0" size={14} />
            <h2 className="text-white font-semibold text-sm truncate">Meetings</h2>
          </>
        ) : (
          <>
            <FiHash className="text-gray-400 flex-shrink-0" size={14} />
            <h2 className="text-white font-semibold text-sm truncate">{currentRoom?.name}</h2>
          </>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {auth?.user && (
          <button
            onClick={onInviteClick}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-700 hover:bg-indigo-800 text-white rounded-md transition-colors text-xs"
            title="Invite people"
          >
            <FiUserPlus size={14} />
            <span className="hidden sm:inline">Invite</span>
          </button>
        )}
        {auth?.user && !showSettings && (userRole === 'OWNER' || userRole === 'ADMIN') && (
          <button
            onClick={onSettingsClick}
            className="relative text-gray-400 hover:text-white transition-colors"
            title={pendingRequestsCount > 0 ? `${pendingRequestsCount} pending join request${pendingRequestsCount === 1 ? '' : 's'}` : 'Bookclub Settings'}
          >
            <FiSettings size={20} />
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 text-white text-[10px] items-center justify-center font-semibold">
                  {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                </span>
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default BookclubHeader;
