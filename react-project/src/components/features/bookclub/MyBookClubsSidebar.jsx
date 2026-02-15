import React from 'react';
import { FiHome, FiMail, FiSend } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { COLLAB_EDITOR_URL, getProfileImageUrl } from '@config/constants';
import logger from '@utils/logger';

// Helper function to get user initials
const getUserInitials = (name) => {
  if (!name) return 'GU';
  
  const parts = name.trim().split(/\s+/); // Split by whitespace
  
  if (parts.length >= 2) {
    // Multiple words: take first letter of first and last word
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  } else {
    // Single word: take first two letters
    return name.substring(0, 2).toUpperCase();
  }
};

const MyBookClubsSidebar = ({ bookClubs, currentBookClubId, onSelectBookClub, onOpenDM, auth }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Check if we're on the DM page
    const isOnDMPage = location.pathname.startsWith('/dm');

    return (
        <div className="w-20 bg-gray-900 border-r border-gray-700 flex flex-col items-center py-4 gap-3 overflow-y-auto">
          {/* Home Button */}
          <button
            onClick={() => navigate('/')}
            className="w-12 h-12 rounded-full bg-gray-700 hover:bg-purple-600 flex items-center justify-center text-white transition-colors flex-shrink-0"
            title="Home"
          >
            <FiHome size={20} />
          </button>
          {onOpenDM && (
            <button 
              onClick={onOpenDM}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors flex-shrink-0 ${
                isOnDMPage
                  ? 'bg-purple-600 ring-2 ring-purple-400'
                  : 'bg-gray-700 hover:bg-purple-600'
              }`}
              title="Direct Messages"
            >
              <FiSend size={20}/>
            </button>
          )}
          
          {/* Separator */}
          <div className="w-10 h-px bg-gray-700"></div>
          
          {/* My Bookclubs */}
          {bookClubs.map((club) => (
            <button
              key={club.id}
              onClick={() => onSelectBookClub(club.id)}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all flex-shrink-0 ${
                !isOnDMPage && club.id === currentBookClubId
                  ? 'bg-purple-600 ring-2 ring-purple-400'
                  : 'bg-gray-700 hover:bg-purple-600 hover:rounded-2xl'
              }`}
              title={club.name}
            >
              {club.imageUrl ? (
                <img
                  src={`${COLLAB_EDITOR_URL}${club.imageUrl}`}
                  alt={club.name}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => { 
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <span className={club.imageUrl ? 'hidden' : ''}>
                {club.name.substring(0, 2).toUpperCase()}
              </span>
            </button>
          ))}
          
          {/* Add Bookclub Button */}
          <button
            onClick={() => navigate('/create-bookclub')}
            className="w-12 h-12 rounded-full bg-gray-700 hover:bg-green-600 flex items-center justify-center text-white text-2xl transition-colors flex-shrink-0"
            title="Create Bookclub"
          >
            +
          </button>
          <button className='cursor-pointer absolute bottom-4' onClick={() => navigate(`/profile/${auth.user.id}`)}>
            <div className="relative">
              <img
                src={getProfileImageUrl(auth.user.profileImage) || '/images/default.webp'} 
                alt={auth.user.name}
                className="w-10 h-10 rounded-full object-cover hover:bg-gray-50 cursor-pointer"
                onError={(e) => { e.target.src = '/images/default.webp'; }}
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-900 bg-green-500"></div>
            </div>
          </button>
          
        </div>
    );
};



export default MyBookClubsSidebar;