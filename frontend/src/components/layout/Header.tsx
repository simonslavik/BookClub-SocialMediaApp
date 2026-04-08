import { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiUsers, FiSun, FiMoon } from 'react-icons/fi';
import AuthContext from '@context/index';
import { useTheme } from '@context/ThemeContext';
import LoginModule from '@components/common/modals/loginModule';
import RegisterModule from '@components/common/modals/registerModule';
import { getProfileImageUrl } from '@config/constants';
import apiClient from '@api/axios';
import logger from '@utils/logger';
import NotificationBell from '@components/features/notifications/NotificationBell';
import FriendRequestDropdown from './FriendRequestDropdown';
import MobileSidebar from './MobileSidebar';

const DEFAULT_AVATAR = '/images/default.webp';

const HomePageHeader = () => {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { mode, isDark, cycleTheme } = useTheme();

  const [showDropdown, setShowDropdown] = useState(false);
  const [newsShowDropdown, setNewsShowDropdown] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);
  const [openRegister, setOpenRegister] = useState(false);

  const newsDropdownRef = useRef(null);
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
    if (newsShowDropdown) setNewsShowDropdown(false);
  };

  const handleFriendAction = useCallback(async (requestId, action) => {
    try {
      await apiClient.post(`/v1/friends/${action}`, { requestId });
      setFriendRequests((prev) => prev.filter((r) => (r.friendshipId || r.id) !== requestId));
    } catch (err) {
      logger.error(`Error ${action}ing friend request:`, err);
    }
  }, []);

  // ─── Effects ────────────────────────────────────────────

  useEffect(() => {
    if (!auth?.user) return;

    const fetchFriendRequests = async () => {
      try {
        const { data } = await apiClient.get('/v1/friends/requests');
        setFriendRequests(data.data || []);
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

      if (newsDropdownRef.current && !newsDropdownRef.current.contains(event.target)) {
        setNewsShowDropdown(false);
      }
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

  const ThemeIcon = () => {
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
  };

  const themeLabel = mode === 'auto' ? 'Auto' : mode === 'dark' ? 'Dark' : 'Light';

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="w-full h-13 bg-warmgray-50 dark:bg-gray-900 border-b border-warmgray-200 dark:border-gray-700 flex items-center px-4 md:px-10 relative transition-colors duration-300 sticky top-0 left-0 z-50">
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        className={`cursor-pointer  flex items-center gap-2`}
      >
        <h2 className="text-lg font-semibold text-stone-800 dark:text-warmgray-100 tracking-tight">
           YourBookClubs.com
        </h2>
      </button>

      {/* ── Authenticated Desktop Nav ── */}
      {auth?.user && (
        <>
          <div className="hidden md:flex md:flex-1 md:items-center md:justify-end">
            <NotificationBell />

            {/* Friend requests button */}
            <div ref={newsDropdownRef} className="relative">
              <button
                onClick={() => { setNewsShowDropdown(!newsShowDropdown); if (showDropdown) setShowDropdown(false); }}
                className="relative px-2 py-2 text-black dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
              >
                <FiUsers size={15} />
                {friendRequests.length > 0 && (
                  <span className="absolute top-1 right-3 flex h-5 w-5 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 text-white text-xs items-center justify-center font-semibold">
                      {friendRequests.length}
                    </span>
                  </span>
                )}
                <FriendRequestDropdown
                  requests={friendRequests}
                  isOpen={newsShowDropdown}
                  onFriendAction={handleFriendAction}
                />
              </button>
            </div>

            {/* "Open BookClubs" link */}
            <button
              onClick={() => navigate('/dm')}
              className="flex items-center ml-2 border border-warmgray-200 dark:border-gray-600 rounded-full cursor-pointer px-3 py-1 hover:bg-warmgray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="font-medium text-sm text-stone-700 dark:text-gray-300">OpenBookClubs</span>
            </button>

            {/* Profile dropdown */}
            <div className="ml-2 mt-2 relative" ref={profileDropdownRef}>
              <button onClick={handleProfileClick}>
                <img
                  src={getProfileImageUrl(auth.user.profileImage) || DEFAULT_AVATAR}
                  alt="Profile"
                  className="h-7.5 w-7.5 rounded-full object-cover border-1 border-gray-200 cursor-pointer"
                  onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
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
                    <ThemeIcon />
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
