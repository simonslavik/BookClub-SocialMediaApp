import AuthContext from '@context/index';
import { useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import HomePageHeader from '@components/layout/Header';
import { COLLAB_EDITOR_URL, getProfileImageUrl } from '@config/constants';
import apiClient from '@api/axios';
import logger from '@utils/logger';
import { useToast } from '@hooks/useUIFeedback';




    


const Home = () => {
    const { auth} = useContext(AuthContext);
    const [bookClubs, setBookClubs] = useState([]);
    const [allMyBookClubs, setAllMyBookClubs] = useState([]);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [filterCreatedByMe, setFilterCreatedByMe] = useState(false);
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);


    const navigate = useNavigate();
    const { toastSuccess, toastError, toastWarning } = useToast();
    
    
    useEffect(() => {
        logger.debug('Home page auth state:', {
            hasAuth: !!auth,
            hasToken: !!auth?.token,
            hasUser: !!auth?.user,
            userId: auth?.user?.id,
            tokenPreview: auth?.token ? `${auth.token.substring(0, 20)}...` : 'no token'
        });
        
        const headers = auth?.token 
            ? { Authorization: `Bearer ${auth.token}` }
            : {};

        // Fetch my created bookclubs (only if authenticated)
        if (auth?.user) {
            // Will be populated from discover endpoint below
            // fetch('http://localhost:3000/v1/editor/bookclubs/my-bookclubs', { headers })
            //     .then(response => {
            //         if (!response.ok) {
            //             console.error('My bookclubs request failed:', response.status, response.statusText);
            //             return response.text().then(text => {
            //                 console.error('Error response:', text);
            //                 throw new Error(`${response.status}: ${text}`);
            //             });
            //         }
            //         return response.json();
            //     })
            //     .then(data => {
            //         console.log('My Created Bookclubs response:', data);
            //         setMyCreatedBookClubs(data.bookClubs || []);
            //     })
            //     .catch(error => console.error('Error fetching my created book clubs:', error));
            
            // Fetch friends and friend requests
            fetchFriends();
            fetchFriendRequests();
        }
        
        // Always fetch all public bookclubs using discover API
        apiClient.get('/v1/bookclubs/discover')
            .then(response => {
                const responseData = response.data;
                logger.debug('All Bookclubs response:', responseData);
                // Handle new API response format { success: true, data: [...] }
                const clubs = responseData.success ? responseData.data : (responseData.bookClubs || []);
                setBookClubs(clubs);
                
                if (auth?.user) {
                    // Collect all bookclubs the user belongs to (created + joined)
                    const myClubs = clubs.filter(club => 
                        club.creatorId === auth.user.id || club.isMember === true
                    );
                    setAllMyBookClubs(myClubs);
                    
                    // Get suggested users from all bookclubs user is in
                    const allUserBookClubs = clubs.filter(club => club.isMember === true);
                    
                    // Note: Suggested users feature would need a separate API endpoint
                    // that returns member details for each club. For now, we'll skip this.
                    // The discover API doesn't include full member arrays to optimize performance.
                    setSuggestedUsers([]);
                }
            })
            .catch(error => logger.error('Error fetching all book clubs:', error));
    }, [auth]);
    
    const createNewBookClub = () => {
        navigate('/create-bookclub');
    };

    const handleSendFriendRequest = async (userId) => {
        if (!auth?.token) {
            logger.error('No auth token available');
            toastWarning('Please log in to send friend requests');
            return;
        }
        
        try {
            logger.debug('Sending friend request to userId:', userId);
            logger.debug('Auth object:', { hasToken: !!auth.token, hasUser: !!auth.user, userId: auth.user?.id });
            
            const response = await apiClient.post('/v1/friends/request', { recipientId: userId });
            
            const data = response.data;
            logger.debug('Friend request response:', data, 'Status:', response.status);
            
            if (response.status === 403 || response.status === 401) {
                toastWarning('Your session has expired. Please log out and log back in.');
                return;
            }
            
            toastSuccess('Friend request sent!');
            // Refetch friend requests to get the updated list with proper IDs
            await fetchFriendRequests();
        } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                toastWarning('Your session has expired. Please log out and log back in.');
                return;
            }
            logger.error('Error sending friend request:', err);
            const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
            toastError('Failed to send friend request: ' + errorMsg);
        }
    };

    const fetchFriends = async () => {
        if (!auth?.token) {
            logger.debug('fetchFriends: No auth token available');
            return;
        }
        
        logger.debug('fetchFriends: Making request with token');
        try {
            const response = await apiClient.get('/v1/friends/list');
            const data = response.data;
            
            setFriends(data.data || []);
        } catch (err) {
            logger.error('Error fetching friends:', err);
        }
    };

    const fetchFriendRequests = async () => {
        if (!auth?.token) {
            logger.debug('fetchFriendRequests: No auth token available');
            return;
        }
        
        logger.debug('fetchFriendRequests: Making request with token');
        try {
            const response = await apiClient.get('/v1/friends/requests');
            const data = response.data;
            
            setFriendRequests(data.data || []);
        } catch (err) {
            logger.error('Error fetching friend requests:', err);
        }
    };



    return (
        <div>
            <HomePageHeader />
            <div className="flex flex-col p-8 w-full min-h-screen gap-4 bg-warmgray-50">
                {auth?.user && (
                    <div className="flex flex-col p-4 rounded w-full">
                        {/* Header with title and filter */}
                        <div className="flex items-center justify-end mb-4">
                            <button
                                onClick={() => { setFilterCreatedByMe(prev => !prev); setCarouselIndex(0); }}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                    filterCreatedByMe
                                        ? 'bg-stone-600 text-white'
                                        : 'bg-warmgray-200 text-stone-600 hover:bg-warmgray-300'
                                }`}
                            >
                                {filterCreatedByMe ? '★ Mine' : '☆ Mine'}
                            </button>
                        </div>

                        {(() => {
                            const displayed = filterCreatedByMe
                                ? allMyBookClubs.filter(c => c.creatorId === auth.user.id)
                                : allMyBookClubs;

                            if (displayed.length === 0) {
                                return (
                                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                                        {filterCreatedByMe ? (
                                            <>
                                                <p className="mb-3">You haven't created any bookclubs yet.</p>
                                                <button
                                                    onClick={createNewBookClub}
                                                    className="px-4 py-2 bg-stone-600 text-white rounded-lg hover:bg-stone-700 transition-colors text-sm font-medium"
                                                >
                                                    Create Your First Book Club
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <p className="mb-3">You're not in any bookclubs yet.</p>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={createNewBookClub}
                                                        className="px-4 py-2 bg-stone-600 text-white rounded-lg hover:bg-stone-700 transition-colors text-sm font-medium"
                                                    >
                                                        Create Book Club
                                                    </button>
                                                    <button
                                                        onClick={() => navigate('/discover')}
                                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                                                    >
                                                        Discover
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            }

                            // Items: bookclubs + the "+" create card at the end
                            const items = [
                                ...displayed.map(c => ({ type: 'club', data: c })),
                                { type: 'create' }
                            ];
                            // Clamp carousel index
                            const idx = Math.min(carouselIndex, items.length - 1);

                            const goPrev = () => setCarouselIndex(i => Math.max(0, i - 1));
                            const goNext = () => setCarouselIndex(i => Math.min(items.length - 1, i + 1));

                            const renderCard = (item, index) => {
                                const offset = index - idx;
                                const isCenter = offset === 0;
                                const absOffset = Math.abs(offset);
                                const scale = isCenter ? 1 : Math.max(0.7, 1 - absOffset * 0.15);
                                const opacity = isCenter ? 1 : Math.max(0.35, 1 - absOffset * 0.35);
                                const zIndex = 10 - absOffset;

                                if (item.type === 'create') {
                                    return (
                                        <div
                                            key="create-card"
                                            onClick={createNewBookClub}
                                            className="w-[300px] h-[440px] flex-shrink-0 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ease-out group"
                                            style={{
                                                transform: `scale(${scale})`,
                                                opacity,
                                                zIndex,
                                                background: isCenter
                                                    ? '#faf9f7'
                                                    : '#f5f3f0',
                                                border: '2px dashed',
                                                borderColor: isCenter ? '#1d1104' : '#d5cec4',
                                                boxShadow: isCenter ? '0 12px 40px rgba(180, 160, 130, 0.15)' : 'none',
                                            }}
                                        >
                                            <div className="w-16 h-16 rounded-full bg-stone-100 group-hover:bg-stone-200 flex items-center justify-center transition-colors mb-3">
                                                <span className="text-3xl text-stone-500 group-hover:text-stone-700 transition-colors">+</span>
                                            </div>
                                            <span className="text-sm text-gray-600 group-hover:text-stone-800 font-semibold transition-colors">Create Book Club</span>
                                        </div>
                                    );
                                }

                                const bookClub = item.data;
                                return (
                                    <div
                                        key={bookClub.id}
                                        onClick={() => navigate(`/bookclub/${bookClub.id}`)}
                                        className="w-[300px] h-[440px] flex-shrink-0 rounded-2xl flex flex-col cursor-pointer transition-all duration-500 ease-out overflow-hidden relative"
                                            style={{
                                            transform: `scale(${scale})`,
                                            opacity,
                                            zIndex,
                                            background: '#fff',
                                            boxShadow: isCenter
                                                ? '0 16px 48px rgba(120, 100, 70, 0.12), 0 0 0 1px rgba(180, 160, 130, 0.15)'
                                                : '0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)',
                                        }}
                                    >
                                        {/* Cover image with gradient overlay */}
                                        <div className="relative h-44 overflow-hidden">
                                            <img
                                                src={bookClub.imageUrl ? `${COLLAB_EDITOR_URL}${bookClub.imageUrl}` : '/images/default.webp'}
                                                alt={bookClub.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.src = '/images/default.webp'; }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                            
                                            {/* Owner badge */}
                                            {bookClub.creatorId === auth.user.id && (
                                                <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-stone-800 text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm">
                                                    ✦ Owner
                                                </span>
                                            )}

                                            {/* Online indicator */}
                                            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
                                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                                <span className="text-white text-xs font-medium">{bookClub.activeUsers || 0} online</span>
                                            </div>
                                        </div>

                                        {/* Card body */}
                                        <div className="flex flex-col flex-1 p-4">
                                            <h3 className="font-semibold text-gray-900 text-base truncate">{bookClub.name}</h3>

                                            {/* Current Book */}
                                            {bookClub.currentBook && (
                                                <div className="mt-2.5 p-2.5 bg-warmgray-50 rounded-lg border border-warmgray-200">
                                                    <p className="text-[10px] uppercase tracking-wider text-stone-600 font-bold mb-1.5">Currently Reading</p>
                                                    <div className="flex gap-2">
                                                        <img
                                                            src={bookClub.currentBook.book?.coverUrl || '/images/default.webp'}
                                                            alt={bookClub.currentBook.book?.title}
                                                            className="w-10 h-14 object-cover rounded shadow-sm"
                                                            onError={(e) => { e.target.src = '/images/default.webp'; }}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">{bookClub.currentBook.book?.title}</p>
                                                            <p className="text-[11px] text-gray-500 truncate mt-0.5">{bookClub.currentBook.book?.author}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Members */}
                                            {bookClub.members && bookClub.members.length > 0 && (
                                                <div className="mt-auto pt-3 flex items-center justify-between">
                                                    <div className="flex -space-x-2">
                                                        {bookClub.members.slice(0, 4).map(member => (
                                                            <img
                                                                key={member.id}
                                                                src={getProfileImageUrl(member.profileImage) || '/images/default.webp'}
                                                                alt={member.username}
                                                                className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm"
                                                                title={member.username}
                                                                onError={(e) => { e.target.src = '/images/default.webp'; }}
                                                            />
                                                        ))}
                                                        {bookClub.members.length > 4 && (
                                                            <div className="w-7 h-7 rounded-full border-2 border-white bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-700">
                                                                +{bookClub.members.length - 4}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-400 font-medium">
                                                        {bookClub.members.length} {bookClub.members.length === 1 ? 'member' : 'members'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            };

                            // Calculate translateX to center the active card
                            const cardWidth = 300;
                            const gap = 20;
                            const stripOffset = -(idx * (cardWidth + gap));

                            return (
                                <div className="relative w-full flex items-center justify-center" style={{ minHeight: '500px' }}>
                                    {/* Left arrow */}
                                    <button
                                        onClick={goPrev}
                                        disabled={idx === 0}
                                        className={`absolute left-40 z-20 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                                            idx === 0
                                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                                : 'bg-white shadow-lg text-gray-600 hover:bg-stone-50 hover:text-stone-700 hover:shadow-xl'
                                        }`}
                                    >
                                        <FiChevronLeft size={22} />
                                    </button>

                                    {/* Carousel track */}
                                    <div className="overflow-hidden w-full px-12" style={{ height: '470px' }}>
                                        <div
                                            className="flex items-center h-full transition-transform duration-500 ease-out"
                                            style={{
                                                gap: `${gap}px`,
                                                transform: `translateX(calc(50% - ${cardWidth / 2}px + ${stripOffset}px))`,
                                            }}
                                        >
                                            {items.map((item, i) => renderCard(item, i))}
                                        </div>
                                    </div>

                                    {/* Right arrow */}
                                    <button
                                        onClick={goNext}
                                        disabled={idx === items.length - 1}
                                        className={`absolute right-40 z-20 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                                            idx === items.length - 1
                                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                                : 'bg-white shadow-lg text-gray-600 hover:bg-stone-50 hover:text-stone-700 hover:shadow-xl'
                                        }`}
                                    >
                                        <FiChevronRight size={22} />
                                    </button>

                                    {/* Dot indicators */}
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                                        {items.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCarouselIndex(i)}
                                                className={`rounded-full transition-all duration-300 ${
                                                    i === idx
                                                        ? 'w-6 h-2.5 bg-stone-700'
                                                        : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}


                <div className='flex justify-center mt-16'>
                    <button 
                        onClick={() => navigate('/discover')}
                        className='font-medium rounded-lg px-5 py-2.5 bg-stone-800 text-white cursor-pointer hover:bg-stone-700 transition-colors text-sm'
                    >
                        Discover More Book Clubs
                    </button>
                </div>
            </div>


        </div>
    );
};

export default Home;