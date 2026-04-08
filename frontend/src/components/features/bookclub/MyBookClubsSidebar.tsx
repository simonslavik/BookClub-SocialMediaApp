import React, { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiHome, FiSend, FiUsers, FiBook } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { getProfileImageUrl, getCollabImageUrl } from '@config/constants';
import StatusPopup from './StatusPopup';
import { getStatusColor } from './statusUtils';

const MyBookClubsSidebar = ({ bookClubs, currentBookClubId, onSelectBookClub, onOpenDM, auth, setAuth, wsRef, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showStatusPopup, setShowStatusPopup] = useState(false);
    const [hoveredClub, setHoveredClub] = useState(null);
    const hoverTimeoutRef = useRef(null);
    
    // Check if we're on the DM page
    const isOnDMPage = location.pathname.startsWith('/dm');

    const handleStatusChange = useCallback((status) => {
      if (auth?.user) {
        setAuth({
          ...auth,
          user: { ...auth.user, status },
        });
      }
    }, [auth, setAuth]);

    const handleMouseEnter = useCallback((club, e) => {
      clearTimeout(hoverTimeoutRef.current);
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredClub({
        ...club,
        x: rect.right + 12,
        y: rect.top + rect.height / 2,
      });
    }, []);

    const handleMouseLeave = useCallback(() => {
      hoverTimeoutRef.current = setTimeout(() => setHoveredClub(null), 150);
    }, []);

    return (
        <div className="w-full h-full bg-gray-900 border-r border-gray-700 flex flex-col items-center py-4 gap-3 overflow-y-auto overflow-x-hidden">
          {/* Home Button */}
          <button
            onClick={() => navigate('/')}
            className="w-12 h-12 rounded-full bg-gray-700 hover:bg-stone-700 flex items-center justify-center text-white transition-colors flex-shrink-0"
            title="Home"
          >
            <FiHome size={20} />
          </button>
          {onOpenDM && (
            <button 
              onClick={onOpenDM}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors flex-shrink-0 ${
                isOnDMPage
                  ? 'bg-stone-700 ring-2 ring-stone-500'
                  : 'bg-gray-700 hover:bg-stone-700'
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
              onMouseEnter={(e) => handleMouseEnter(club, e)}
              onMouseLeave={handleMouseLeave}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                !isOnDMPage && club.id === currentBookClubId
                  ? 'bg-stone-700 ring-2 ring-stone-500'
                  : 'bg-gray-700 hover:bg-stone-700'
              }`}
              title=""
            >
              {club.imageUrl ? (
                <img
                  src={getCollabImageUrl(club.imageUrl)}
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

          {/* Spacer to push avatar to bottom */}
          <div className="flex-1" />

          <button className='cursor-pointer flex-shrink-0' onClick={() => setShowStatusPopup(prev => !prev)}>
            <div className="relative">
              <img
                src={getProfileImageUrl(auth.user.profileImage) || '/images/default.webp'} 
                alt={auth.user.name}
                className="w-10 h-10 rounded-full object-cover hover:bg-gray-50 cursor-pointer"
                onError={(e) => { e.target.src = '/images/default.webp'; }}
              />
              <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${getStatusColor(auth.user.status || 'ONLINE')}`}></div>
            </div>
          </button>
          {showStatusPopup && (
            <StatusPopup
              user={auth.user}
              onStatusChange={handleStatusChange}
              wsRef={wsRef}
              onLogout={onLogout}
            />
          )}

          {/* Hover info card for bookclubs */}
          {hoveredClub && createPortal(
            <div
              className="fixed bg-gray-800 text-white rounded-xl shadow-2xl border border-gray-600 p-3 w-56 pointer-events-none"
              style={{
                zIndex: 99999,
                left: hoveredClub.x,
                top: hoveredClub.y,
                transform: 'translateY(-50%)',
              }}
            >
              {/* Arrow */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-800 border-l border-b border-gray-600 rotate-45" />
              
              {/* Club image + name */}
              <div className="flex items-center gap-2.5 mb-2">
                {hoveredClub.imageUrl ? (
                  <img
                    src={getCollabImageUrl(hoveredClub.imageUrl)}
                    alt={hoveredClub.name}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-stone-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {hoveredClub.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{hoveredClub.name}</p>
                  {hoveredClub.category && (
                    <p className="text-[10px] text-gray-400 truncate">{hoveredClub.category}</p>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 text-[11px] text-gray-300">
                <span className="flex items-center gap-1">
                  <FiUsers className="w-3 h-3" />
                  {hoveredClub.memberCount || 0} {(hoveredClub.memberCount || 0) === 1 ? 'member' : 'members'}
                </span>
                {hoveredClub.currentBooks?.length > 0 && (
                  <span className="flex items-center gap-1">
                    <FiBook className="w-3 h-3" />
                    {hoveredClub.currentBooks.length} {hoveredClub.currentBooks.length === 1 ? 'book' : 'books'}
                  </span>
                )}
              </div>

              {/* Description preview */}
              {hoveredClub.description && (
                <p className="text-[11px] text-gray-400 mt-1.5 line-clamp-2 leading-tight">
                  {hoveredClub.description}
                </p>
              )}
            </div>,
            document.body
          )}
          
        </div>
    );
};



export default MyBookClubsSidebar;