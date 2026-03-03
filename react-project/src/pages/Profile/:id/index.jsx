
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '@context/index';
import HomePageHeader from '@components/layout/Header';
import { FiInfo, FiMail, FiMessageCircle, FiPlus, FiEdit2, FiUserPlus, FiUserCheck, FiClock, FiBook, FiUsers, FiCalendar } from 'react-icons/fi';
import AddBookToLibraryModal from '@components/common/modals/AddBookToLibraryModal';
import BookDetailsModal from '@components/common/modals/BookDetails';
import { COLLAB_EDITOR_URL, getProfileImageUrl } from '@config/constants';
import apiClient from '@api/axios';
import logger from '@utils/logger';
import { useConfirm, useToast } from '@hooks/useUIFeedback';


const ProfilePage = () => {
  const { id } = useParams();
  const { auth, setAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { toastError, toastWarning } = useToast();
  
  const [profile, setProfile] = useState(null);
  const [createdBookClubs, setCreatedBookClubs] = useState([]);
  const [memberBookClubs, setMemberBookClubs] = useState([]);
  const [currentUserBookClubs, setCurrentUserBookClubs] = useState([]); // Current user's bookclubs for messaging
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [friendRequestLoading, setFriendRequestLoading] = useState(false);
  
  // Image upload states
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  
  const isOwnProfile = auth?.user?.id === id;


  // Books
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [booksImReading, setBooksImReading] = useState([]);
  const [booksToRead, setBooksToRead] = useState([]);
  const [booksRead, setBooksRead] = useState([]);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showBookDetails, setShowBookDetails] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookFilter, setBookFilter] = useState('all');


  const onCloseBookDetails = () => {
    setShowBookDetails(false);
    setSelectedBook(null);
  };

  // Fetch books function that can be reused
  const fetchBooks = async (userId) => {
    const uid = userId || id;
    try {
      const { data: data2 } = await apiClient.get(`/v1/user-books?status=favorite&userId=${uid}`);
      if (data2.success) {
        setFavoriteBooks(data2.data || []);
      }
    } catch (err) {
      logger.warn('Failed to fetch favorite books:', err);
    }

    try {
      const { data: data3 } = await apiClient.get(`/v1/user-books?status=reading&userId=${uid}`);
      if (data3.success) {
        setBooksImReading(data3.data || []);
      }
    } catch (err) {
      logger.warn('Failed to fetch reading books:', err);
    }

    try {
      const { data: data4 } = await apiClient.get(`/v1/user-books?status=want_to_read&userId=${uid}`);
      if (data4.success) {
        setBooksToRead(data4.data || []);
      }
    } catch (err) {
      logger.warn('Failed to fetch want_to_read books:', err);
    }

    try {
      const { data: data5 } = await apiClient.get(`/v1/user-books?status=completed&userId=${uid}`);
      if (data5.success) {
        setBooksRead(data5.data || []);
      }
    } catch (err) {
      logger.warn('Failed to fetch completed books:', err);
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile with optional auth for friendship status
        const profileResponse = await apiClient.get(`/v1/profile/${id}`);
        const profileData = profileResponse.data;
        
        if (profileData.success) {
          setProfile(profileData.data);
        } else {
          setError('Failed to load profile');
          return;
        }
        
        // Fetch user's created bookclubs - filter from discover endpoint
        let allBookClubsData = { success: false, data: [] };
        
        try {
          const allBookClubsResponse = await apiClient.get('/v1/bookclubs/discover');
          allBookClubsData = allBookClubsResponse.data;
          
          // Handle new API response format { success: true, data: [...] }
          const clubs = allBookClubsData.success ? allBookClubsData.data : (allBookClubsData.bookClubs || []);
            
            // Filter for created bookclubs
            const created = clubs.filter(club => club.creatorId === id);
            setCreatedBookClubs(created);
            
            // Filter bookclubs where this user is a member (but not creator to avoid duplicates)
            // The new API includes 'isMember' property when userId is provided
            const memberClubs = clubs.filter(club => {
              const isCreator = club.creatorId === id;
              const isMember = club.isMember === true;
              return isMember && !isCreator; // Only show if member but not creator
            });
            setMemberBookClubs(memberClubs);
        } catch (err) {
          logger.warn('Failed to fetch all bookclubs:', err);
        }

        // Fetch books
        await fetchBooks(id); 
        
        // Fetch current user's bookclubs for messaging functionality
        if (auth?.user?.id && !isOwnProfile) {
          try {
            // Filter from already fetched bookclubs for current user
            const currentUserAllClubs = [];
            
            if (allBookClubsData.bookClubs) {
              // Get bookclubs created by current user
              const currentUserCreated = (allBookClubsData.bookClubs || []).filter(club => club.creatorId === auth.user.id);
              currentUserAllClubs.push(...currentUserCreated);
              
              // Get bookclubs where current user is a member
              const currentUserMemberClubs = (allBookClubsData.bookClubs || []).filter(club => {
                const isMember = club.members.some(member => 
                  typeof member === 'string' ? member === auth.user.id : member.id === auth.user.id
                );
                const isCreator = club.creatorId === auth.user.id;
                return isMember && !isCreator;
              });
              currentUserAllClubs.push(...currentUserMemberClubs);
            }
            
            setCurrentUserBookClubs(currentUserAllClubs);
          } catch (err) {
            logger.warn('Failed to fetch current user bookclubs:', err);
          }
        }
        
      } catch (err) {
        logger.error('Error fetching profile:', err);
        logger.error('Error details:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfileData();
    }
  }, [id, auth]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Automatically upload the image
      uploadImage(file);
    }
  };

  const uploadImage = async (file) => {
    if (!auth?.token) {
      toastWarning('Please login to change profile picture');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiClient.post('/v1/profile/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const data = response.data;
      // Update profile state
      setProfile(prev => ({
        ...prev,
        profileImage: data.imageUrl
      }));
      // Update auth context only if user exists and this is own profile
      if (auth?.user && isOwnProfile) {
        setAuth({
          user: {
            ...auth.user,
            profileImage: data.imageUrl
          },
          token: auth.token,
          refreshToken: auth.refreshToken
        });
      }
      // Reset selection
      setSelectedImage(null);
      setImagePreview(null);
    } catch (err) {
      logger.error('Error uploading image:', err);
      toastError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const DeleteUserBook = async (userBookId) => {
    try {
      await apiClient.delete(`/v1/user-books/${userBookId}`);

      // Remove the book from local state
      setFavoriteBooks(prev => prev.filter(ub => ub.id !== userBookId));
      setBooksImReading(prev => prev.filter(ub => ub.id !== userBookId));
      setBooksToRead(prev => prev.filter(ub => ub.id !== userBookId));
      setBooksRead(prev => prev.filter(ub => ub.id !== userBookId));
    } catch (err) {
      logger.error('Error deleting user book:', err);
      toastError(err.response?.data?.message || 'Failed to delete book');
    }
  }

  if (loading) {
    return (
      <div>
        <HomePageHeader />
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div>
        <HomePageHeader />
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="text-xl text-red-500 mb-4">{error || 'Profile not found'}</div>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-stone-700 text-white rounded-lg hover:bg-stone-600"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-warmgray-50">
      <HomePageHeader />
      
      {/* Hero Banner */}
      <div className="relative h-44 md:h-52 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Card — overlaps the banner */}
        <div className="relative -mt-24 mb-8">
          <div className="bg-white rounded-2xl shadow-sm  p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              {/* Avatar */}
              <div className="relative -mt-20 md:-mt-24 flex-shrink-0">
                <div className="w-36 h-36 md:w-40 md:h-40 rounded-2xl overflow-hidden border-1 border-white shadow-lg bg-white">
                  <img 
                    src={imagePreview || getProfileImageUrl(profile.profileImage) || '/images/default.webp'}
                    alt={profile.name}
                    className={`w-full h-full object-cover ${
                      isOwnProfile ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
                    }`}
                    onClick={() => isOwnProfile && fileInputRef.current?.click()}
                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                  />
                </div>
                {uploadingImage && (
                  <div className="absolute inset-0 -mt-20 md:-mt-24 flex items-center justify-center bg-black/50 rounded-2xl">
                    <div className="text-white text-sm font-medium">Uploading...</div>
                  </div>
                )}
                {isOwnProfile && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-1 right-1 w-8 h-8 bg-stone-600 hover:bg-stone-700 text-white rounded-lg flex items-center justify-center shadow-sm transition-colors"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </>
                )}
              </div>

              {/* Name & Bio */}
              <div className="flex-1 text-center md:text-left pb-1">
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-800">{profile.name}</h1>
                {profile.bio && (
                  <p className="mt-1.5 text-gray-500 text-sm max-w-lg leading-relaxed">{profile.bio}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 flex-shrink-0 pb-1">
                {isOwnProfile ? (
                  <button
                    onClick={() => navigate('/change-profile')}
                    className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm flex items-center gap-2"
                  >
                    <FiEdit2 size={15} />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => navigate(`/dm/${id}`)}
                      className="px-5 py-2.5 bg-stone-600 text-white rounded-xl hover:bg-stone-700 transition-colors font-medium text-sm flex items-center gap-2 shadow-sm"
                    >
                      <FiMessageCircle size={15} />
                      Message
                    </button>
                    
                    {profile.friendshipStatus === 'friends' ? (
                      <button
                        className="px-5 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl font-medium text-sm flex items-center gap-2 cursor-default"
                        disabled
                      >
                        <FiUserCheck size={15} />
                        Friends
                      </button>
                    ) : profile.friendshipStatus === 'request_sent' ? (
                      <button
                        className="px-5 py-2.5 bg-stone-50 text-stone-700 border border-stone-200 rounded-xl font-medium text-sm flex items-center gap-2 cursor-default"
                        disabled
                      >
                        <FiClock size={15} />
                        Pending
                      </button>
                    ) : profile.friendshipStatus === 'request_received' ? (
                      <button
                        onClick={() => navigate('/')}
                        className="px-5 py-2.5 bg-stone-600 text-white rounded-xl hover:bg-stone-700 transition-colors font-medium text-sm flex items-center gap-2"
                      >
                        Respond
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          if (!auth?.token) {
                            navigate('/login');
                            return;
                          }
                          setFriendRequestLoading(true);
                          try {
                            await apiClient.post('/v1/friends/request', { recipientId: id });
                            setProfile(prev => ({ ...prev, friendshipStatus: 'request_sent' }));
                          } catch (err) {
                            logger.error('Error sending friend request:', err);
                            toastError(err.response?.data?.message || 'Failed to send friend request');
                          } finally {
                            setFriendRequestLoading(false);
                          }
                        }}
                        disabled={friendRequestLoading}
                        className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <FiUserPlus size={15} />
                        {friendRequestLoading ? 'Sending...' : 'Add Friend'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="mt-6 pt-6 border-warmgray-200 flex items-center justify-center md:justify-start gap-4 md:gap-12">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center">
                  <FiBook className="text-stone-600" size={18} />
                </div>
                <div>
                  <div className="text-lg font-bold text-stone-800">{createdBookClubs.length + memberBookClubs.length}</div>
                  <div className="text-xs text-stone-500">Book Clubs</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-xl bg-warmgray-100 flex items-center justify-center">
                  <FiUsers className="text-stone-600" size={18} />
                </div>
                <div>
                  <div className="text-lg font-bold text-stone-800">{profile.numberOfFriends || 0}</div>
                  <div className="text-xs text-stone-500">Friends</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Book Clubs Sections */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <h2 className="text-xl font-serif font-bold text-stone-800">
              {isOwnProfile ? 'My Book Clubs' : `${profile.name}'s Book Clubs`}
            </h2>
            <span className="text-xs font-semibold bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full">
              {createdBookClubs.length + memberBookClubs.length}
            </span>
          </div>

          {createdBookClubs.length === 0 && memberBookClubs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-warmgray-200 p-12 text-center">
              <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiBook className="text-stone-400" size={28} />
              </div>
              <p className="text-stone-500 mb-4">
                {isOwnProfile ? "You haven't joined any book clubs yet" : "No book clubs yet"}
              </p>
              {isOwnProfile && (
                <button
                  onClick={() => navigate('/create-bookclub')}
                  className="px-5 py-2.5 bg-stone-600 text-white rounded-xl hover:bg-stone-700 transition-colors font-medium text-sm"
                >
                  Create Your First Book Club
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...createdBookClubs, ...memberBookClubs].map(club => {
                const isCreator = club.creatorId === id;
                return (
                  <div
                    key={club.id}
                    onClick={() => navigate(`/bookclub/${club.id}`)}
                    className="group bg-white rounded-2xl shadow-sm border border-warmgray-200 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {/* Club image */}
                    <div className="relative h-40 overflow-hidden">
                      <img 
                        src={club.imageUrl ? `${COLLAB_EDITOR_URL}${club.imageUrl}` : '/images/default.webp'}
                        alt={club.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = '/images/default.webp'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {isCreator && (
                          <span className="bg-white/90 text-stone-700 text-[11px] px-2 py-0.5 rounded-full font-semibold shadow-sm">
                            ✦ Owner
                          </span>
                        )}
                      </div>

                      {/* Online pill */}
                      {(club.activeUsers || 0) > 0 && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                          <span className="text-white text-[11px] font-medium">{club.activeUsers} online</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Card body */}
                    <div className="p-4">
                      <h3 className="font-semibold text-stone-800 truncate">{club.name}</h3>
                      
                      {/* Current Book */}
                      {club.currentBook && (
                        <div className="mt-2.5 p-2.5 bg-warmgray-50 rounded-lg border border-warmgray-200">
                          <p className="text-[10px] uppercase tracking-wider text-stone-600 font-bold mb-1.5">Currently Reading</p>
                          <div className="flex gap-2">
                            <img 
                              src={club.currentBook.book?.coverUrl || '/images/default.webp'}
                              alt={club.currentBook.book?.title}
                              className="w-9 h-12 object-cover rounded shadow-sm"
                              onError={(e) => { e.target.src = '/images/default.webp'; }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">{club.currentBook.book?.title}</p>
                              <p className="text-[11px] text-gray-500 truncate mt-0.5">{club.currentBook.book?.author}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Members row */}
                      {club.members && club.members.length > 0 && (
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {club.members.slice(0, 4).map((member, idx) => (
                              <img 
                                key={idx}
                                src={getProfileImageUrl(member.profileImage) || '/images/default.webp'}
                                alt=""
                                className="w-6 h-6 rounded-full border-2 border-white object-cover"
                                onError={(e) => { e.target.src = '/images/default.webp'; }}
                              />
                            ))}
                            {club.members.length > 4 && (
                              <div className="w-6 h-6 rounded-full border-2 border-white bg-stone-100 flex items-center justify-center text-[9px] font-bold text-stone-700">
                                +{club.members.length - 4}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {club.memberCount || club.members?.length || 0} members
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Books Library Section */}
        {(favoriteBooks.length > 0 || booksImReading.length > 0 || booksToRead.length > 0 || booksRead.length > 0 || isOwnProfile) && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif font-bold text-stone-800">
                  {isOwnProfile ? 'My Library' : `${profile.name}'s Library`}
                </h2>
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => setShowAddBookModal(true)}
                  className="px-5 py-2.5 bg-stone-600 hover:bg-stone-700 text-white rounded-xl font-medium text-sm shadow-sm transition-all flex items-center gap-2"
                >
                  <FiPlus size={16} />
                  Add Books
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { key: 'all', label: 'All', count: favoriteBooks.length + booksImReading.length + booksToRead.length + booksRead.length },
                { key: 'reading', label: 'Reading', count: booksImReading.length },
                { key: 'want_to_read', label: 'Want to Read', count: booksToRead.length },
                { key: 'completed', label: 'Read', count: booksRead.length },
                { key: 'favorite', label: 'Favorites', count: favoriteBooks.length },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setBookFilter(tab.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    bookFilter === tab.key
                      ? 'bg-stone-800 text-white shadow-sm'
                      : 'bg-white text-stone-600 hover:bg-warmgray-100 border border-warmgray-200'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 text-xs ${
                    bookFilter === tab.key ? 'text-gray-400' : 'text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Book Grid */}
            {(() => {
              const filteredBooks = bookFilter === 'all'
                ? [
                    ...booksImReading.map(b => ({ ...b, _shelf: 'reading' })),
                    ...booksToRead.map(b => ({ ...b, _shelf: 'want_to_read' })),
                    ...booksRead.map(b => ({ ...b, _shelf: 'completed' })),
                    ...favoriteBooks.map(b => ({ ...b, _shelf: 'favorite' })),
                  ]
                : bookFilter === 'favorite' ? favoriteBooks.map(b => ({ ...b, _shelf: 'favorite' }))
                : bookFilter === 'reading' ? booksImReading.map(b => ({ ...b, _shelf: 'reading' }))
                : bookFilter === 'want_to_read' ? booksToRead.map(b => ({ ...b, _shelf: 'want_to_read' }))
                : booksRead.map(b => ({ ...b, _shelf: 'completed' }));

              const shelfLabel = { favorite: '♥ Favorite', reading: 'Reading', want_to_read: 'Want to Read', completed: 'Finished' };
              const shelfBg = { favorite: 'bg-red-50 text-red-600', reading: 'bg-green-50 text-green-600', want_to_read: 'bg-stone-50 text-stone-700', completed: 'bg-stone-100 text-stone-600' };

              if (filteredBooks.length === 0) {
                return (
                  <div className="bg-white rounded-2xl shadow-sm border border-warmgray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FiBook className="text-stone-400" size={28} />
                    </div>
                    <p className="text-gray-500">
                      {isOwnProfile
                        ? bookFilter === 'all'
                          ? 'No books in your library yet. Click "Add Books" to get started!'
                          : 'No books on this shelf yet.'
                        : 'No books in library yet.'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {filteredBooks.map(userBook => (
                    <div key={userBook.id} className="group">
                      <div className="relative rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                        <img
                          src={userBook.book.coverUrl || '/images/default.webp'}
                          alt={userBook.book.title}
                          className="w-full h-56 object-cover"
                          onError={(e) => { e.target.src = '/images/default.webp'; }}
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-end p-3 gap-2">
                          <div className="flex items-center gap-2">
                            {isOwnProfile && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const ok = await confirm('Remove this book from your library?', { title: 'Remove Book', variant: 'danger', confirmLabel: 'Remove' });
                                  if (ok) DeleteUserBook(userBook.id);
                                }}
                                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors"
                              >
                                Remove
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBook(userBook.book);
                                setShowBookDetails(true);
                              }}
                              className="p-2 bg-white/90 hover:bg-white text-gray-800 rounded-lg transition-colors"
                            >
                              <FiInfo size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Shelf badge */}
                        {bookFilter === 'all' && (
                          <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${shelfBg[userBook._shelf]}`}>
                            {shelfLabel[userBook._shelf]}
                          </span>
                        )}
                        
                        {/* Rating */}
                        {userBook.rating && (
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-yellow-400 text-[11px] font-bold px-2 py-0.5 rounded-full">
                            {'★'.repeat(userBook.rating)}
                          </div>
                        )}
                      </div>
                      <h4 className="mt-2.5 text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">{userBook.book.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{userBook.book.author}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Add Book Modal */}
        {showAddBookModal && (
          <AddBookToLibraryModal
            onClose={() => setShowAddBookModal(false)}
            onBookAdded={async () => {
              // Refetch books to show newly added books (modal stays open)
              await fetchBooks(id);
            }}
          />
        )}

        {showBookDetails && (
          <BookDetailsModal 
            onClose={onCloseBookDetails}
            book={selectedBook} 
          />
        )}
      </div>
    </div>
  );
};

export default ProfilePage;