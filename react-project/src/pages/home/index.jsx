import AuthContext from '@context/index';
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import HomePageHeader from '@components/layout/Header';
import { COLLAB_EDITOR_URL, getProfileImageUrl } from '@config/constants';
import apiClient from '@api/axios';
import logger from '@utils/logger';
import { useToast } from '@hooks/useUIFeedback';




    


const Home = () => {
    const { auth} = useContext(AuthContext);
    const [bookClubs, setBookClubs] = useState([]);
    const [myCreatedBookClubs, setMyCreatedBookClubs] = useState([]);
    const [myMemberBookClubs, setMyMemberBookClubs] = useState([]);
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
                
                // Filter for bookclubs where user is a member but not creator
                if (auth?.user) {
                    // Filter created bookclubs
                    const createdClubs = clubs.filter(club => club.creatorId === auth.user.id);
                    setMyCreatedBookClubs(createdClubs);
                    
                    // Filter member bookclubs (using isMember from API)
                    const memberClubs = clubs.filter(club => {
                        const isCreator = club.creatorId === auth.user.id;
                        const isMember = club.isMember === true;
                        return isMember && !isCreator;
                    });
                    setMyMemberBookClubs(memberClubs);
                    
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
            <div className="flex flex-col p-8 w-full min-h-screen gap-4">
                {auth?.user && (
                    <div className="flex flex-col justify-center items-center p-4 rounded w-full">
                        <h1 className='text-xl mb-4 font-mono font-light '>BookClubs Created By You</h1>
                        {myCreatedBookClubs.length === 0 ? (
                            <button onClick={createNewBookClub}>
                                <div className="p-4 border rounded hover:bg-gray-50 cursor-pointer w-17 h-17 flex items-center justify-center">
                                    <h3 className="font-medium text-2xl">+</h3>
                                </div>
                            </button>
                        ) : (
                            <div className="flex gap-4 overflow-x-auto pb-4 w-full scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-500">
                                {myCreatedBookClubs.map(bookClub => (
                                    <div 
                                        key={bookClub.id}
                                        onClick={() => navigate(`/bookclub/${bookClub.id}`)}
                                        className="p-4 shadow border rounded cursor-pointer flex-shrink-0 w-[280px] h-[420px] flex flex-col"
                                    >
                                        <img 
                                            src={bookClub.imageUrl ? `${COLLAB_EDITOR_URL}${bookClub.imageUrl}` : '/images/default.webp'} 
                                            alt={bookClub.name}
                                            className="w-full h-40 object-cover mb-3 rounded"
                                            onError={(e) => { e.target.src = '/images/default.webp'; }}
                                        />
                                        <h3 className="font-sans truncate">{bookClub.name}</h3>
                                        {bookClub.members && bookClub.members.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-sm font-sans text-gray-600 mb-1">
                                                    {bookClub.members.length} {bookClub.members.length === 1 ? 'member' : 'members'}
                                                </p>
                                                <div className="flex -space-x-2">
                                                    {bookClub.members.slice(0, 5).map(member => (
                                                        <img 
                                                            key={member.id} 
                                                            src={getProfileImageUrl(member.profileImage) || '/images/default.webp'} 
                                                            alt={member.username} 
                                                            className="w-8 h-8 rounded-full border-2 border-white object-cover"
                                                            title={member.username}
                                                            onError={(e) => { e.target.src = '/images/default.webp'; }}
                                                        />
                                                    ))}
                                                    {bookClub.members.length > 5 && (
                                                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700">
                                                            +{bookClub.members.length - 5}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-sm font-sans text-gray-600 mt-2">
                                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                            {bookClub.activeUsers || 0} online
                                        </p>
                                    </div>
                                    
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {auth?.user && (
                <div className='flex justify-center'>
                    <button className='font-medium border-0.5 rounded p-2  bg-gray-200 text-gray-800 cursor-pointer hover:bg-gray-100'  onClick={createNewBookClub}>
                        Create New Book Club
                    </button>
                </div>
                )}
                
                {auth?.user && myMemberBookClubs.length > 0 && (
                    <div className="flex flex-col p-4 rounded w-full">
                        <h1 className='font-semibold text-xl mb-4'>Book Clubs I'm In</h1>
                        <div className="flex gap-4 overflow-x-auto">
                            {myMemberBookClubs.map(bookClub => (
                                <div 
                                    key={bookClub.id}
                                    onClick={() => navigate(`/bookclub/${bookClub.id}`)}
                                    className="p-4 border rounded hover:bg-gray-50 cursor-pointer flex-shrink-0 w-[280px] h-[420px] flex flex-col"
                                >
                                    <img 
                                        src={bookClub.imageUrl ? `${COLLAB_EDITOR_URL}${bookClub.imageUrl}` : '/images/default.webp'} 
                                        alt={bookClub.name}
                                        className="w-full h-40 object-cover mb-3 rounded"
                                        onError={(e) => { e.target.src = '/images/default.webp'; }}
                                    />
                                    <h3 className="font-medium truncate">{bookClub.name}</h3>
                                    
                                    {/* Current Book */}
                                    {bookClub.currentBook && (
                                        <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                                            <p className="text-xs text-purple-600 font-semibold mb-1">📖 Currently Reading</p>
                                            <div className="flex gap-2">
                                                <img 
                                                    src={bookClub.currentBook.book?.coverUrl || '/images/default.webp'}
                                                    alt={bookClub.currentBook.book?.title}
                                                    className="w-12 h-16 object-cover rounded"
                                                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-gray-900 line-clamp-2">{bookClub.currentBook.book?.title}</p>
                                                    <p className="text-xs text-gray-600 truncate">{bookClub.currentBook.book?.author}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {bookClub.members && bookClub.members.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-600 mb-1">
                                                {bookClub.members.length} {bookClub.members.length === 1 ? 'member' : 'members'}
                                            </p>
                                            <div className="flex -space-x-2">
                                                {bookClub.members.slice(0, 5).map(member => (
                                                    <img 
                                                        key={member.id} 
                                                        src={getProfileImageUrl(member.profileImage) || '/images/default.webp'} 
                                                        alt={member.username} 
                                                        className="w-8 h-8 rounded-full border-2 border-white object-cover"
                                                        title={member.username}
                                                        onError={(e) => { e.target.src = '/images/default.webp'; }}
                                                    />
                                                ))}
                                                {bookClub.members.length > 5 && (
                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700">
                                                        +{bookClub.members.length - 5}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-600 mt-2">
                                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                        {bookClub.activeUsers || 0} online
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Suggested Users Section */}
                {auth?.user && suggestedUsers.length > 0 && (
                    <div className="flex flex-col p-4 rounded w-full">
                        <h1 className='font-semibold text-xl mb-4'>People You Might Know</h1>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {suggestedUsers.map(user => {
                                const isFriend = friends.some(f => f.id === user.id);
                                const hasPendingRequest = friendRequests.some(
                                    req => (req.recipientId === user.id || req.senderId === user.id) && req.status === 'PENDING'
                                );
                                
                                return (
                                <div 
                                    key={user.id}
                                    className="p-4 border rounded hover:shadow-md transition-shadow cursor-pointer flex-shrink-0 w-[200px] bg-white"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedUser(user);
                                        setShowUserModal(true);
                                        navigate(`/profile/${user.id}`);
                                    }}
                                >
                                    <div className="flex flex-col items-center">
                                        <img 
                                            src={getProfileImageUrl(user.profileImage) || '/images/default.webp'}
                                            alt={user.username}
                                            className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-gray-200"
                                            onError={(e) => { e.target.src = '/images/default.webp'; }}
                                        />
                                        <h3 className="font-medium text-center truncate w-full">{user.username}</h3>
                                        <p className="text-xs text-gray-500 mt-1 text-center">
                                            {user.sharedBookClubs.length} shared book{user.sharedBookClubs.length !== 1 ? 's' : ''}
                                        </p>
                                        {isFriend ? (
                                            <button 
                                                className='bg-green-500 text-white px-3 py-1 rounded mt-3 text-sm cursor-default'
                                                disabled
                                            >
                                                ✓ Friends
                                            </button>
                                        ) : hasPendingRequest ? (
                                            <button 
                                                className='bg-gray-400 text-white px-3 py-1 rounded mt-3 text-sm cursor-default'
                                                disabled
                                            >
                                                Pending
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSendFriendRequest(user.id);
                                                }}
                                                className='bg-purple-600 text-white px-3 py-1 rounded mt-3 text-sm hover:bg-purple-700 transition-colors'
                                            >
                                                Add Friend
                                            </button>
                                        )}
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className='flex justify-center'>
                    <button 
                        onClick={() => navigate('/discover')}
                        className='font-medium border-0.5 rounded p-2  bg-gray-200 text-gray-800 cursor-pointer hover:bg-gray-100'
                    >
                        Discover More Book Clubs
                    </button>
                </div>
            </div>


        </div>
    );
};

export default Home;