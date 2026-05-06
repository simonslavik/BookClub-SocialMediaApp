import { useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiSun, FiMoon } from 'react-icons/fi';
import AuthContext from '@context/index';
import { useTheme } from '@context/ThemeContext';
import LoginModule from '@components/common/modals/loginModule';
import RegisterModule from '@components/common/modals/registerModule';
import { getProfileImageUrl } from '@config/constants';
import apiClient from '@api/axios';
import logger from '@utils/logger';
import NotificationBell from '@components/features/notifications/NotificationBell';
import MobileSidebar from './MobileSidebar';

const DEFAULT_AVATAR = '/images/default.webp';

const HomePageHeader = () => {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { mode, isDark, cycleTheme } = useTheme();

  const [showDropdown, setShowDropdown] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);
  const [openRegister, setOpenRegister] = useState(false);

  const profileDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // ─── Handlers ───────────────────────────────────────────

  const handleLogout = useCallback(() => {
    setShowDropdown(false);
    logout();
    navigate('/');
  }, [logout, navigate]);

  const handleProfileClick = () => {
    setShowDropdown((prev) => !prev);
  };

  const handleFriendAction = useCallback(async (requestId, action) => {
    try {
      await apiClient.post(`/v1/friends/${action}`, { friendshipId: requestId });
      // Refresh friend requests after action
      const { data } = await apiClient.get('/v1/friends/requests');
      const incomingRequests = (data.data || []).filter(r => r.friendId === auth?.user?.id);
      setFriendRequests(incomingRequests);
    } catch (err) {
      logger.error(`Error ${action}ing friend request:`, err);
    }
  }, [auth?.user?.id]);

  // ─── Effects ────────────────────────────────────────────

  useEffect(() => {
    if (!auth?.user) return;

    const fetchFriendRequests = async () => {
      try {
        const { data } = await apiClient.get('/v1/friends/requests');
        // Filter to only show incoming requests (requests sent TO this user)
        const incomingRequests = (data.data || []).filter(r => r.friendId === auth.user.id);
        setFriendRequests(incomingRequests);
      } catch (err) {
        logger.error('Error fetching friend requests:', err);
      }
    };

    fetchFriendRequests();
  }, [auth?.user?.id]);

  // Listen for open-login events from other components (e.g. HeroSection CTA)
  useEffect(() => {
    const handleOpenLogin = () => setOpenLogin(true);
    window.addEventListener('open-login', handleOpenLogin);
    return () => window.removeEventListener('open-login', handleOpenLogin);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the click target was removed from the DOM (e.g. accepted friend request),
      // don't close dropdowns — the element was inside the dropdown before removal.
      if (!document.body.contains(event.target)) return;

      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Theme icon helper ─────────────────────────────────

  const themeIcon = useMemo(() => {
    if (mode === 'auto') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          <path d="M16 12a4 4 0 0 1-4 4" fill="currentColor" opacity="0.3" />
        </svg>
      );
    }
    return isDark ? <FiMoon size={15} /> : <FiSun size={15} />;
  }, [mode, isDark]);

  const themeLabel = mode === 'auto' ? 'Auto' : mode === 'dark' ? 'Dark' : 'Light';

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="w-full h-13 bg-warmgray-50 dark:bg-gray-900 border-b border-warmgray-200 dark:border-gray-700 flex items-center px-4 md:px-10 relative transition-colors duration-300 sticky top-0 left-0 z-50">
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        className={`cursor-pointer flex items-center gap-2`}
      >
        <img
          src="/images/Group 1 (Traced).png"
          alt="MyBookClubs"
          className="h-12 w-auto dark:invert"
        />
      </button>

      {/* ── Authenticated Desktop Nav ── */}
      {auth?.user && (
        <>
          <div className="hidden md:flex md:flex-1 md:items-center md:justify-end">
            <NotificationBell />

            {/* Friends link (with pending-request badge) */}
            <button
              onClick={() => navigate('/people', friendRequests.length > 0 ? { state: { tab: 'requests' } } : undefined)}
              className="relative flex items-center ml-2 rounded-full cursor-pointer px-3 py-1 hover:bg-warmgray-100 dark:hover:bg-gray-700 transition-colors"
              title={friendRequests.length > 0 ? `${friendRequests.length} pending friend request${friendRequests.length === 1 ? '' : 's'}` : 'Friends'}
            >
              <span className="font-medium text-sm text-stone-700 dark:text-gray-300">Friends</span>
              {friendRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 text-white text-[10px] items-center justify-center font-semibold">
                    {friendRequests.length > 9 ? '9+' : friendRequests.length}
                  </span>
                </span>
              )}
            </button>

            {/* Discover link */}
            <button
              onClick={() => navigate('/discover')}
              className="flex items-center ml-1 rounded-full cursor-pointer px-3 py-1 hover:bg-warmgray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="font-medium text-sm text-stone-700 dark:text-gray-300">Discover</span>
            </button>

            {/* Open App link */}
            <button
              onClick={() => navigate('/dm')}
              className="flex items-center ml-2 bg-stone-800 dark:bg-stone-700 rounded-full cursor-pointer px-4 py-1.5 hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors"
            >
              <span className="font-medium text-sm text-white">Open App</span>
            </button>

            {/* Profile dropdown */}
            <div className="ml-2 mt-2 relative" ref={profileDropdownRef}>
              <button onClick={handleProfileClick}>
                <img
                  src={getProfileImageUrl(auth.user.profileImage) || DEFAULT_AVATAR}
                  alt="Profile"
                  className="h-7.5 w-7.5 rounded-full object-cover border-1 border-gray-200 cursor-pointer"
                  onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                />
              </button>
              {showDropdown && (
                <div className="absolute right-4 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-10">
                  <button onClick={() => { navigate(`/profile/${auth.user.id}`); setShowDropdown(false); }} className="px-4 py-2 border-b border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left dark:text-gray-200">
                    View Profile
                  </button>
                  <button onClick={() => navigate('/change-profile')} className="px-4 py-2 border-b border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left dark:text-gray-200">
                    Change Profile Settings
                  </button>
                  <button onClick={() => navigate('/create-bookclub')} className="px-4 py-2 border-b border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left dark:text-gray-200">
                    Create Book Club
                  </button>
                  <button
                    onClick={cycleTheme}
                    className="w-full text-left px-4 py-2 border-b border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 dark:text-gray-200"
                  >
                    {themeIcon}
                    Theme: {themeLabel}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden ml-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {showMobileMenu
              ? <FiX size={24} className="dark:text-gray-200" />
              : <FiMenu size={24} className="dark:text-gray-200" />}
          </button>

          {/* Mobile sidebar */}
          {showMobileMenu && (
            <MobileSidebar
              ref={mobileMenuRef}
              user={auth.user}
              friendRequests={friendRequests}
              mode={mode}
              isDark={isDark}
              onClose={() => setShowMobileMenu(false)}
              onNavigate={navigate}
              onLogout={handleLogout}
              onCycleTheme={cycleTheme}
              onFriendAction={handleFriendAction}
            />
          )}
        </>
      )}

      {/* ── Guest Nav ── */}
      {!auth?.user && (
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => navigate('/discover')}
            className="text-sm font-medium text-stone-700 dark:text-warmgray-200 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
          >
            Discover
          </button>
          <button
            onClick={() => setOpenLogin(true)}
            className="px-5 py-1.5 border border-stone-800 dark:border-warmgray-200 text-stone-800 dark:text-warmgray-200 rounded-full hover:bg-stone-100 dark:hover:bg-gray-800 transition text-sm font-medium cursor-pointer"
          >
            Log In
          </button>
          <button
            onClick={() => setOpenRegister(true)}
            className="px-5 py-1.5 bg-stone-800 dark:bg-warmgray-200 dark:text-stone-900 text-white rounded-full hover:bg-stone-700 dark:hover:bg-warmgray-300 transition text-sm font-medium cursor-pointer"
          >
            Sign Up
          </button>
        </div>
      )}

      {/* Auth modals (portalled to body) */}
      {openLogin && createPortal(
        <LoginModule
          onClose={() => setOpenLogin(false)}
          onSwitchToRegister={() => { setOpenLogin(false); setOpenRegister(true); }}
        />,
        document.body
      )}
      {openRegister && createPortal(
        <RegisterModule
          onClose={() => setOpenRegister(false)}
          onSwitchToLogin={() => { setOpenRegister(false); setOpenLogin(true); }}
        />,
        document.body
      )}
    </div>
  );
};

export default HomePageHeader;
