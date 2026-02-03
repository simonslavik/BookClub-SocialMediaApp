import AuthContext from '../../context';
import { useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FiBell, FiMail, FiMenu, FiX, FiUser, FiSettings, FiLogOut, FiPlusCircle } from 'react-icons/fi';
import LoginModule from '../common/modals/loginModule';
import RegisterModule from '../common/modals/registerModule';


    


const HomePageHeader = () => {
    const { auth, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [newsShowDropdown, setNewsShowDropdown] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [friendRequests, setFriendRequests] = useState([]);
    const [userBookClubs, setUserBookClubs] = useState([]);
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
        if (newsShowDropdown) {
            setNewsShowDropdown(false);
        }


    };

    useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const headers = auth?.token 
          ? { Authorization: `Bearer ${auth.token}` }
          : {};
        
        const response = await fetch(`http://localhost:3000/v1/friends/requests`, { headers });
        const data = await response.json();
        setLoading(true);
        if (response.ok) {
          setFriendRequests(data.data || []);
          console.log('Friend Requests:', data);

        } else {
          setError(data.error || 'Failed to load friend requests');
        }
      } catch (err) {
        console.error('Error fetching friend requests:', err);
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };
    
    const fetchUserBookClubs = async () => {
      try {
        const headers = auth?.token 
          ? { Authorization: `Bearer ${auth.token}` }
          : {};
        
        // Use discover API to get user's bookclubs
        const response = await fetch('http://localhost:3000/v1/bookclubs/discover', { headers });
        const data = await response.json();
        
        if (response.ok) {
          // Filter for clubs where user is a member
          const clubs = data.success ? data.data : (data.bookClubs || []);
          const userClubs = clubs.filter(club => club.isMember === true);
          setUserBookClubs(userClubs);
        }
      } catch (err) {
        console.error('Error fetching user bookclubs:', err);
      }
    };
    
    if (auth?.user) {
      fetchFriendRequests();
      fetchUserBookClubs();
    }
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
        <div className="w-full h-16 bg-white border-b border-gray-300 flex items-center px-4 md:px-10 relative">
            <button onClick={() => navigate('/')} className={`cursor-pointer md:ml-40 mr-20 md:mr-0 flex-1 flex ${showMobileMenu ? 'justify-start' : 'justify-end'} items-center gap-2`}>
                <h1 className="text-lg md:text-xl font-bold">YourBookClub.com</h1>
            </button>
            {auth?.user && (
            <>
            {/* Desktop Navigation */}
            <div className='hidden md:flex md:flex-1 md:items-center md:justify-end'>
                <div ref={newsDropdownRef} className="relative">
                    <button 
                        onClick={() => { setNewsShowDropdown(!newsShowDropdown); if (showDropdown) { setShowDropdown(false); } }} 
                        className="relative px-2 py-2 text-black rounded hover:bg-gray-100 transition cursor-pointer"
                    >
                    <FiBell size={22} />
                    {friendRequests.length > 0 && (
                        <span className="absolute top-1 right-3 flex h-5 w-5 items-center justify-center">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 text-white text-xs items-center justify-center font-semibold">
                                {friendRequests.length}
                            </span>
                        </span>
                    )}
                    {newsShowDropdown && (
                        <div className="absolute right-4 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                                <h3 className="text-sm font-semibold text-gray-900">Friend Requests</h3>
                                <p className="text-xs text-gray-500 mt-0.5">{friendRequests.length} pending</p>
                            </div>
                            {friendRequests.length === 0 ? (
                                <div className="px-4 py-8 text-center">
                                    <FiBell className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                                    <p className="text-sm text-gray-500">No new friend requests</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {friendRequests.map((request) => (
                                        <div key={request.id} className="px-4 py-3 hover:bg-gray-50 transition">
                                            <div className="flex items-start space-x-3">
                                                <img 
                                                    src={request.user.profileImage 
                                                        ? `http://localhost:3001${request.user.profileImage}` 
                                                        : "/images/default.webp"} 
                                                    alt={request.user.name}
                                                    className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                                                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-900">
                                                        <span className="font-semibold">{request.user.name}</span>
                                                        <span className="text-gray-600"> sent you a friend request</span>
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{request.user.email}</p>
                                                    <div className="mt-3 flex space-x-2">
                                                        <button 
                                                            onClick={async () => {
                                                                try {
                                                                    const headers = auth?.token 
                                                                    ? { 
                                                                        'Content-Type': 'application/json',
                                                                        Authorization: `Bearer ${auth.token}` 
                                                                        }
                                                                    : {};
                                                                    const response = await fetch('http://localhost:3000/v1/friends/accept', {
                                                                        method: 'POST',
                                                                        headers,
                                                                        body: JSON.stringify({ requestId: request.id }),
                                                                    });
                                                                    if (response.ok) {
                                                                        setFriendRequests(prev => prev.filter(r => r.id !== request.id));
                                                                    } else {
                                                                        const data = await response.json();
                                                                        console.error('Failed to accept:', data);
                                                                    }
                                                                } catch (err) {
                                                                    console.error('Error accepting friend request:', err);
                                                                }
                                                            }} 
                                                            className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition text-xs font-medium"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button 
                                                            onClick={async () => {
                                                                try {
                                                                    const headers = auth?.token 
                                                                    ? { 
                                                                        'Content-Type': 'application/json',
                                                                        Authorization: `Bearer ${auth.token}` 
                                                                        }
                                                                    : {};
                                                                    const response = await fetch('http://localhost:3000/v1/friends/reject', {
                                                                        method: 'POST',
                                                                        headers,
                                                                        body: JSON.stringify({ requestId: request.id }),
                                                                    });
                                                                    if (response.ok) {
                                                                        setFriendRequests(prev => prev.filter(r => r.id !== request.id));
                                                                    } else {
                                                                        const data = await response.json();
                                                                        console.error('Failed to reject:', data);
                                                                    }
                                                                } catch (err) {
                                                                    console.error('Error rejecting friend request:', err);
                                                                }
                                                            }} 
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
                    onClick={() => {
                        if (userBookClubs.length > 0) {
                            // Navigate to first bookclub in DM mode
                            navigate(`/bookclub/${userBookClubs[0].id}`, { state: { viewMode: 'dm' } });
                        } else {
                            // Fallback to messages page if no bookclubs
                            navigate(`/messages${auth?.user ? `/${auth.user.id}` : ''}`);
                        }
                    }}
                    className="flex items-center ml-4 border-2 border-gray-200 rounded-full cursor-pointer p-2 hover:bg-gray-100 border-t-indigo-400 "
                >
                    <span className="ml-2 font-medium">OpenBookClubs</span>
                </button>
                <div className="ml-4 relative" ref={profileDropdownRef}>
                    <button onClick={handleProfileClick}>
                        <div>
                            <img src={auth.user.profileImage 
                                    ? `http://localhost:3001${auth.user.profileImage}` 
                                    : "/images/default.webp"}
                                alt="Profile" 
                                className="h-11 w-11 rounded-full object-cover border-2 border-gray-200 cursor-pointer"
                                onError={(e) => { e.target.src = '/images/default.webp'; }}
                            />
                        </div>
                    </button>
                    {showDropdown && (
                        <div className="absolute right-4 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-10">
                            <button onClick={() => { navigate(`/profile/${auth.user.id}`); setShowDropdown(false); if (newsShowDropdown) { setNewsShowDropdown(false); } }} className="px-4 py-2 border-b border-gray-300 text-sm hover:bg-gray-100 w-full text-left">
                                View Profile
                            </button>
                            <button onClick={() => navigate('/change-profile')} className="px-4 py-2 border-b border-gray-300 text-sm hover:bg-gray-100 w-full text-left">
                                Change Profile Settings
                            </button>
                            <button onClick={() => navigate('/create-bookclub')} className="px-4 py-2 border-b border-gray-300 text-sm hover:bg-gray-100 w-full text-left">
                                Create Book Club
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
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
                className={`md:hidden ml-auto p-2 hover:bg-gray-100 rounded-lg transition-colors`}
            >
                {showMobileMenu ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>

            {/* Mobile Sidebar Menu */}
            {showMobileMenu && (
                <div 
                    ref={mobileMenuRef}
                    className="md:hidden fixed top-[0px] right-0 w-80 h-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto"
                >   
                    <div className='flex justify-end'>
                        <button 
                            onClick={() => setShowMobileMenu(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <FiX size={24} />
                        </button>
                    </div>
                    {/* Profile Section */}
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                        <div className="flex items-center gap-3">
                            <img 
                                src={auth.user.profileImage 
                                    ? `http://localhost:3001${auth.user.profileImage}` 
                                    : "/images/default.webp"}
                                alt="Profile" 
                                className="h-14 w-14 rounded-full object-cover border-2 border-purple-300"
                                onError={(e) => { e.target.src = '/images/default.webp'; }}
                            />
                            <div>
                                <p className="font-semibold text-gray-900">{auth.user.name}</p>
                                <p className="text-sm text-gray-600">{auth.user.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Friend Requests Section */}
                    <div className="border-b border-gray-200">
                        <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FiBell className="text-gray-600" size={18} />
                                <span className="font-semibold text-sm text-gray-900">Friend Requests</span>
                            </div>
                            {friendRequests.length > 0 && (
                                <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                                    {friendRequests.length}
                                </span>
                            )}
                        </div>
                        {friendRequests.length === 0 ? (
                            <div className="px-4 py-4 text-center">
                                <p className="text-sm text-gray-500">No pending requests</p>
                            </div>
                        ) : (
                            <div className="max-h-64 overflow-y-auto">
                                {friendRequests.map((request) => (
                                    <div key={request.id} className="px-4 py-3 border-b border-gray-100">
                                        <div className="flex items-start gap-3">
                                            <img 
                                                src={request.user.profileImage 
                                                    ? `http://localhost:3001${request.user.profileImage}` 
                                                    : "/images/default.webp"} 
                                                alt={request.user.name}
                                                className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                                                onError={(e) => { e.target.src = '/images/default.webp'; }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{request.user.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{request.user.email}</p>
                                                <div className="mt-2 flex gap-2">
                                                    <button 
                                                        onClick={async () => {
                                                            try {
                                                                const headers = auth?.token 
                                                                ? { 
                                                                    'Content-Type': 'application/json',
                                                                    Authorization: `Bearer ${auth.token}` 
                                                                    }
                                                                : {};
                                                                const response = await fetch('http://localhost:3000/v1/friends/accept', {
                                                                    method: 'POST',
                                                                    headers,
                                                                    body: JSON.stringify({ requestId: request.id }),
                                                                });
                                                                if (response.ok) {
                                                                    setFriendRequests(prev => prev.filter(r => r.id !== request.id));
                                                                }
                                                            } catch (err) {
                                                                console.error('Error accepting friend request:', err);
                                                            }
                                                        }} 
                                                        className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition text-xs font-medium"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            try {
                                                                const headers = auth?.token 
                                                                ? { 
                                                                    'Content-Type': 'application/json',
                                                                    Authorization: `Bearer ${auth.token}` 
                                                                    }
                                                                : {};
                                                                const response = await fetch('http://localhost:3000/v1/friends/reject', {
                                                                    method: 'POST',
                                                                    headers,
                                                                    body: JSON.stringify({ requestId: request.id }),
                                                                });
                                                                if (response.ok) {
                                                                    setFriendRequests(prev => prev.filter(r => r.id !== request.id));
                                                                }
                                                            } catch (err) {
                                                                console.error('Error rejecting friend request:', err);
                                                            }
                                                        }} 
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
                                if (userBookClubs.length > 0) {
                                    navigate(`/bookclub/${userBookClubs[0].id}`, { state: { viewMode: 'dm' } });
                                } else {
                                    navigate(`/messages${auth?.user ? `/${auth.user.id}` : ''}`);
                                }
                                setShowMobileMenu(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-center gap-3 border-b border-gray-100"
                        >
                            <FiMail className="text-purple-600" size={20} />
                            <span className="font-medium">Messages</span>
                        </button>
                        
                        <button 
                            onClick={() => { 
                                navigate(`/profile/${auth.user.id}`); 
                                setShowMobileMenu(false); 
                            }} 
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-center gap-3 border-b border-gray-100"
                        >
                            <FiUser className="text-blue-600" size={20} />
                            <span className="font-medium">View Profile</span>
                        </button>
                        
                        <button 
                            onClick={() => { 
                                navigate('/change-profile'); 
                                setShowMobileMenu(false); 
                            }} 
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-center gap-3 border-b border-gray-100"
                        >
                            <FiSettings className="text-gray-600" size={20} />
                            <span className="font-medium">Settings</span>
                        </button>
                        
                        <button 
                            onClick={() => { 
                                navigate('/create-bookclub'); 
                                setShowMobileMenu(false); 
                            }} 
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-center gap-3 border-b border-gray-100"
                        >
                            <FiPlusCircle className="text-green-600" size={20} />
                            <span className="font-medium">Create Book Club</span>
                        </button>
                        
                        <button
                            onClick={() => {
                                handleLogout();
                                setShowMobileMenu(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-red-50 transition flex items-center gap-3 text-red-600 border-b border-gray-100"
                        >
                            <FiLogOut size={20} />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            )}
            </>
            )}

            {!auth?.user && (
            <div className='ml-auto flex gap-2 flex-1 justify-end'>
                <button 
                    onClick={() => setOpenLogin(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition mr-1"
                >
                    Login
                </button>
                <button 
                    onClick={() => setOpenRegister(true)}
                    className="px-4 py-2 bg-blue-950 text-white rounded hover:bg-blue-700 transition"
                >
                    Register
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