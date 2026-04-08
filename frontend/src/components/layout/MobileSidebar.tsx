import { forwardRef } from 'react';
import {
  FiBell,
  FiMail,
  FiX,
  FiUser,
  FiSettings,
  FiLogOut,
  FiPlusCircle,
  FiSun,
  FiMoon,
} from 'react-icons/fi';
import { getProfileImageUrl } from '@config/constants';

const DEFAULT_AVATAR = '/images/default.webp';

/** Auto-theme icon (sun + moon combo). */
const AutoThemeIcon = ({ size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-amber-500"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    <path d="M16 12a4 4 0 0 1-4 4" fill="currentColor" opacity="0.3" />
  </svg>
);

/** Helper to render the correct theme icon. */
const ThemeIcon = ({ mode, isDark, size = 20 }) => {
  if (mode === 'auto') return <AutoThemeIcon size={size} />;
  if (isDark) return <FiMoon size={size} className="text-indigo-400" />;
  return <FiSun size={size} className="text-amber-500" />;
};

const THEME_LABEL = { auto: 'Auto', dark: 'Dark', light: 'Light' };

/**
 * Full-height slide-over sidebar for mobile navigation.
 */
const MobileSidebar = forwardRef(({
  user,
  friendRequests,
  mode,
  isDark,
  onClose,
  onNavigate,
  onLogout,
  onCycleTheme,
  onFriendAction,
}, ref) => {
  const nav = (path) => {
    onNavigate(path);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="md:hidden fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      <div
        ref={ref}
        className="md:hidden fixed top-0 right-0 w-80 max-w-[85vw] h-full bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto"
      >
        {/* Close button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiX size={24} className="dark:text-gray-200" />
          </button>
        </div>

        {/* Profile */}
        <div className="p-6 border-b border-warmgray-200 dark:border-gray-700 bg-warmgray-50 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <img
              src={getProfileImageUrl(user.profileImage) || DEFAULT_AVATAR}
              alt="Profile"
              className="h-14 w-14 rounded-full object-cover border-2 border-warmgray-300"
              onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
            />
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Friend requests */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiBell className="text-gray-600 dark:text-gray-400" size={18} />
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Friend Requests</span>
            </div>
            {friendRequests.length > 0 && (
              <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                {friendRequests.length}
              </span>
            )}
          </div>

          {friendRequests.length === 0 ? (
            <div className="px-4 py-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No pending requests</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {friendRequests.map((request) => (
                <div key={request.id} className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-start gap-3">
                    <img
                      src={getProfileImageUrl(request.user?.profileImage) || DEFAULT_AVATAR}
                      alt={request.user?.name}
                      className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                      onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{request.user?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{request.user?.email}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => onFriendAction(request.id, 'accept')}
                          className="flex-1 px-3 py-1.5 bg-stone-600 text-white rounded-md hover:bg-stone-700 transition text-xs font-medium"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => onFriendAction(request.id, 'reject')}
                          className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition text-xs font-medium"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation links */}
        <nav className="py-2">
          {[
            { icon: FiMail, label: 'Messages', path: '/dm', color: 'text-stone-600 dark:text-stone-400' },
            { icon: FiUser, label: 'View Profile', path: `/profile/${user.id}`, color: 'text-stone-600 dark:text-stone-400' },
            { icon: FiSettings, label: 'Settings', path: '/change-profile', color: 'text-gray-600 dark:text-gray-400' },
            { icon: FiPlusCircle, label: 'Create Book Club', path: '/create-bookclub', color: 'text-green-600' },
          ].map((item) => {
            const NavIcon = item.icon;
            return (
            <button
              key={item.path}
              onClick={() => nav(item.path)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-3 border-b border-gray-100 dark:border-gray-700"
            >
              <NavIcon className={item.color} size={20} />
              <span className="font-medium dark:text-gray-200">{item.label}</span>
            </button>
            );
          })}

          {/* Logout */}
          <button
            onClick={() => { onLogout(); onClose(); }}
            className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-3 text-red-600 border-b border-gray-100 dark:border-gray-700"
          >
            <FiLogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={onCycleTheme}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-3 border-b border-gray-100 dark:border-gray-700"
          >
            <ThemeIcon mode={mode} isDark={isDark} />
            <span className="font-medium dark:text-gray-200">
              Theme: {THEME_LABEL[mode] ?? mode}
            </span>
          </button>
        </nav>
      </div>
    </>
  );
});

MobileSidebar.displayName = 'MobileSidebar';

export default MobileSidebar;
