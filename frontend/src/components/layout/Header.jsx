import { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiMail, FiMenu, FiX, FiUser, FiSettings, FiLogOut, FiPlusCircle, FiUsers, FiSun, FiMoon } from 'react-icons/fi';
import AuthContext from '@context/index';
import { useTheme } from '@context/ThemeContext';
import LoginModule from '@components/common/modals/loginModule';
import RegisterModule from '@components/common/modals/registerModule';
import { getProfileImageUrl } from '@config/constants';
import apiClient from '@api/axios';
import logger from '@utils/logger';
import NotificationBell from '@components/features/notifications/NotificationBell';

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


    
    const handleLogout = () => {
        setShowDropdown(false);
        logout();
        navigate('/');
    };

    const handleProfileClick = () => {
        setShowDropdown(!showDropdown);
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
    }, [auth]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (newsDropdownRef.current && !newsDropdownRef.current.contains(event.target)) {
        setNewsShowDropdown(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
    return (
        <div className="w-full h-13 bg-warmgray-50 dark:bg-gray-900 border-b border-warmgray-200 dark:border-gray-700 flex items-center px-4 md:px-10 relative transition-colors duration-300 sticky top-0 left-0 z-50">
            <button onClick={() => navigate('/')} className={`cursor-pointer ${auth?.user ? 'md:absolute md:left-1/2 md:-translate-x-1/2' : ''} flex items-center gap-2`}>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-warmgray-100 tracking-tight">{auth?.user ? 'MyBookClubs' : 'YourBookClubs.com'}</h2>
            </button>
            {auth?.user && (
            <>
            {/* Desktop Navigation */}
            <div className='hidden md:flex md:flex-1 md:items-center md:justify-end'>
                <NotificationBell />
                <div ref={newsDropdownRef} className="relative">
                    <button 
                        onClick={() => { setNewsShowDropdown(!newsShowDropdown); if (showDropdown) { setShowDropdown(false); } }} 
                        className="relative px-2 py-2 text-black dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                    >
                    <FiUsers size={15} />
                    {friendRequests.length > 0 && (
                        <span className="absolute top-1 right-3 flex h-5 w-5 items-center justify-center">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 text-white text-xs items-center justify-center font-semibold">
                                {friendRequests.length}
                            </span>
                        </span>
                    )}
                    {newsShowDropdown && (
                        <div className="absolute right-4 mt-2 w-60 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-lg">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Friend Requests</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{friendRequests.length} pending</p>
                            </div>
                            {friendRequests.length === 0 ? (
                                <div className="px-4 py-8 text-center">
                                    <FiUsers className="mx-auto h-6 w-6 text-gray-300 dark:text-gray-600 mb-2" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No new friend requests</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {friendRequests.map((request) => (
                                        <div key={request.friendshipId} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                            <div className="flex items-start space-x-3">
                                                <img 
                                                    src={getProfileImageUrl(request.from?.profileImage) || DEFAULT_AVATAR} 
                                                    alt={request.from?.name || 'User'}
                                                    className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                                                    onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-900 dark:text-gray-100">
                                                        <span className="font-semibold">{request.from?.name || 'Unknown User'}</span>
                                                        <span className="text-gray-600 dark:text-gray-400"> sent you a friend request</span>
                                                    </p>
                                                    
                                                    <div className="mt-3 flex space-x-2">
                                                        <button 
                                                            onClick={() => handleFriendAction(request.friendshipId, 'accept')}
                                                            className="flex-1 px-3 py-1.5 bg-stone-600 text-white rounded-md hover:bg-stone-700 transition text-xs font-medium"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button 
                                                            onClick={() => handleFriendAction(request.friendshipId, 'reject')}
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
                    )}
                    </button>
                </div>
                <button 
                    onClick={() => navigate('/dm')}
                    className="flex items-center ml-2 border border-warmgray-200 dark:border-gray-600 rounded-full cursor-pointer px-3 py-1 hover:bg-warmgray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <span className="font-medium text-sm text-stone-700 dark:text-gray-300">OpenBookClubs</span>
                </button>
                <div className="ml-2 mt-2 relative" ref={profileDropdownRef}>
                    <button onClick={handleProfileClick}>
                        <div>
                            <img src={getProfileImageUrl(auth.user.profileImage) || DEFAULT_AVATAR}
                                alt="Profile" 
                                className="h-7.5 w-7.5 rounded-full object-cover border-1 border-gray-200 cursor-pointer"
                                onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                            />
                        </div>
                    </button>
                    {showDropdown && (
                        <div className="absolute right-4 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-10">
                            <button onClick={() => { navigate(`/profile/${auth.user.id}`); setShowDropdown(false); if (newsShowDropdown) { setNewsShowDropdown(false); } }} className="px-4 py-2 border-b border-gray-300 dark:border-gray-700 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left dark:text-gray-200">
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
                                {mode === 'auto' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/><path d="M16 12a4 4 0 0 1-4 4" fill="currentColor" opacity="0.3"/></svg>
                                ) : isDark ? (
                                    <FiMoon size={15} />
                                ) : (
                                    <FiSun size={15} />
                                )}
                                Theme: {mode === 'auto' ? 'Auto' : mode === 'dark' ? 'Dark' : 'Light'}
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
            
            {/* Mobile Burger Menu Button */}
            <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className={`md:hidden ml-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors`}
            >
                {showMobileMenu ? <FiX size={24} className="dark:text-gray-200" /> : <FiMenu size={24} className="dark:text-gray-200" />}
            </button>

            {/* Mobile Sidebar Menu */}
            {showMobileMenu && (
                <>
                {/* Backdrop overlay */}
                <div 
                    className="md:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setShowMobileMenu(false)}
                />
                <div 
                    ref={mobileMenuRef}
                    className="md:hidden fixed top-0 right-0 w-80 max-w-[85vw] h-full bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto"
                >   
                    <div className='flex justify-end'>
                        <button 
                            onClick={() => setShowMobileMenu(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <FiX size={24} className="dark:text-gray-200" />
                        </button>
                    </div>
                    {/* Profile Section */}
                    <div className="p-6 border-b border-warmgray-200 dark:border-gray-700 bg-warmgray-50 dark:bg-gray-900">
                        <div className="flex items-center gap-3">
                            <img 
                                src={getProfileImageUrl(auth.user.profileImage) || DEFAULT_AVATAR}
                                alt="Profile" 
                                className="h-14 w-14 rounded-full object-cover border-2 border-warmgray-300"
                                onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                            />
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{auth.user.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{auth.user.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Friend Requests Section */}
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
                                                        onClick={() => handleFriendAction(request.id, 'accept')}
                                                        className="flex-1 px-3 py-1.5 bg-stone-600 text-white rounded-md hover:bg-stone-700 transition text-xs font-medium"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button 
                                                        onClick={() => handleFriendAction(request.id, 'reject')}
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

                    {/* Navigation Links */}
                    <div className="py-2">
                        <button 
                            onClick={() => {
                                navigate('/dm');
                                setShowMobileMenu(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-3 border-b border-gray-100 dark:border-gray-700"
                        >
                            <FiMail className="text-stone-600 dark:text-stone-400" size={20} />
                            <span className="font-medium dark:text-gray-200">Messages</span>
                        </button>
                        
                        <button 
                            onClick={() => { 
                                navigate(`/profile/${auth.user.id}`); 
                                setShowMobileMenu(false); 
                            }} 
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-3 border-b border-gray-100 dark:border-gray-700"
                        >
                            <FiUser className="text-stone-600 dark:text-stone-400" size={20} />
                            <span className="font-medium dark:text-gray-200">View Profile</span>
                        </button>
                        
                        <button 
                            onClick={() => { 
                                navigate('/change-profile'); 
                                setShowMobileMenu(false); 
                            }} 
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-3 border-b border-gray-100 dark:border-gray-700"
                        >
                            <FiSettings className="text-gray-600 dark:text-gray-400" size={20} />
                            <span className="font-medium dark:text-gray-200">Settings</span>
                        </button>
                        
                        <button 
                            onClick={() => { 
                                navigate('/create-bookclub'); 
                                setShowMobileMenu(false); 
                            }} 
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-3 border-b border-gray-100 dark:border-gray-700"
                        >
                            <FiPlusCircle className="text-green-600" size={20} />
                            <span className="font-medium dark:text-gray-200">Create Book Club</span>
                        </button>
                        
                        <button
                            onClick={() => {
                                handleLogout();
                                setShowMobileMenu(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-3 text-red-600 border-b border-gray-100 dark:border-gray-700"
                        >
                            <FiLogOut size={20} />
                            <span className="font-medium">Logout</span>
                        </button>

                        {/* Mobile Theme Toggle */}
                        <button
                            onClick={cycleTheme}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-3 border-b border-gray-100 dark:border-gray-700"
                        >
                            {mode === 'auto' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/><path d="M16 12a4 4 0 0 1-4 4" fill="currentColor" opacity="0.3"/></svg>
                            ) : isDark ? (
                                <FiMoon size={20} className="text-indigo-400" />
                            ) : (
                                <FiSun size={20} className="text-amber-500" />
                            )}
                            <span className="font-medium dark:text-gray-200">Theme: {mode === 'auto' ? 'Auto' : mode === 'dark' ? 'Dark' : 'Light'}</span>
                        </button>
                    </div>
                </div>
                </>
            )}
            </>
            )}

            {!auth?.user && (
            <div className='ml-auto flex items-center gap-6'>
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

            {/* Login and Register Modals */}
            {openLogin && (
                <LoginModule 
                    onClose={() => setOpenLogin(false)} 
                    onSwitchToRegister={() => { setOpenLogin(false); setOpenRegister(true); }}
                />
            )}
            {openRegister && (
                <RegisterModule 
                    onClose={() => setOpenRegister(false)} 
                    onSwitchToLogin={() => { setOpenRegister(false); setOpenLogin(true); }}
                />
            )}
        </div>
    );
};

export default HomePageHeader;