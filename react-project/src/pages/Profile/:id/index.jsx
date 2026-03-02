
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '@context/index';
import HomePageHeader from '@components/layout/Header';
import { FiInfo, FiMail, FiMessageCircle, FiPlus } from 'react-icons/fi';
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
  const fetchBooks = async () => {
    try {
      const { data: data2 } = await apiClient.get('/v1/user-books?status=favorite');
      if (data2.success) {
        setFavoriteBooks(data2.data || []);
      }
    } catch (err) {
      logger.warn('Failed to fetch favorite books:', err);
    }

    try {
      const { data: data3 } = await apiClient.get('/v1/user-books?status=reading');
      if (data3.success) {
        setBooksImReading(data3.data || []);
      }
    } catch (err) {
      logger.warn('Failed to fetch reading books:', err);
    }

    try {
      const { data: data4 } = await apiClient.get('/v1/user-books?status=want_to_read');
      if (data4.success) {
        setBooksToRead(data4.data || []);
      }
    } catch (err) {
      logger.warn('Failed to fetch want_to_read books:', err);
    }

    try {
      const { data: data5 } = await apiClient.get('/v1/user-books?status=completed');
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
        await fetchBooks(); 
        
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
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
    <div className="min-h-screen bg-gray-50">
      <HomePageHeader />
      
      <div className="max-w-6xl mx-auto p-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start gap-6">
            {/* Profile Image */}
            <div className="relative">
              <img 
                src={imagePreview || getProfileImageUrl(profile.profileImage) || '/images/default.webp'}
                alt={profile.name}
                className={`w-32 h-32 rounded-full object-cover border-4 border-purple-200 ${
                  isOwnProfile ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
                }`}
                onClick={() => isOwnProfile && fileInputRef.current?.click()}
                onError={(e) => { e.target.src = '/images/default.webp'; }}
              />
              {uploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <div className="text-white text-sm">Uploading...</div>
                </div>
              )}
              {isOwnProfile && (
                <>
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
            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                  {profile.bio && (
                    <p className="mt-2 text-gray-600 text-sm max-w-lg">{profile.bio}</p>
                  )}
                </div>
                
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/change-profile')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
                {!isOwnProfile && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        // Navigate directly to DM page with the user's ID
                        navigate(`/dm/${id}`);
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Message
                    </button>
                    
                    {profile.friendshipStatus === 'friends' ? (
                      <button
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg cursor-not-allowed"
                        disabled
                      >
                        Friends
                      </button>
                    ) : profile.friendshipStatus === 'request_sent' ? (
                      <button
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg cursor-not-allowed"
                        disabled
                      >
                        Request Pending
                      </button>
                    ) : profile.friendshipStatus === 'request_received' ? (
                      <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Respond to Request
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
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {friendRequestLoading ? 'Sending...' : 'Add Friend'}
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex gap-8">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{createdBookClubs.length + memberBookClubs.length}</div>
                  <div className="text-sm text-gray-600">Book Clubs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {profile.numberOfFriends || 0}
                  </div>
                  <div className="text-sm text-gray-600">Friends</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{joinDate}</div>
                  <div className="text-sm text-gray-600">Member Since</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Created Book Clubs Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isOwnProfile ? 'My Book Clubs' : `Book Clubs by ${profile.name}`}
          </h2>
          
          {createdBookClubs.length === 0 ? (
            <div className="text-center py-12" >
              <div className="text-gray-400 text-lg mb-4">
                {isOwnProfile ? "You haven't created any book clubs yet" : "No book clubs created yet"}
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => navigate('/create-bookclub')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create Your First Book Club
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {createdBookClubs.map(club => (
                <div
                  key={club.id}
                  onClick={() => navigate(`/bookclubpage/${club.id}`)}
                  className="border rounded-lg p-4 hover:shadow-lg cursor-pointer transition-shadow"
                >
                  <img 
                    src={club.imageUrl 
                      ? `${COLLAB_EDITOR_URL}${club.imageUrl}` 
                      : '/images/default.webp'
                    }
                    alt={club.name}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                  />
                  <h3 className="font-semibold text-lg truncate mb-2">{club.name}</h3>
                  
                  {/* Current Book */}
                  {club.currentBook && (
                    <div className="mt-2 mb-2 p-2 bg-purple-50 rounded border border-purple-200">
                      <p className="text-xs text-purple-600 font-semibold mb-1">📖 Currently Reading</p>
                      <div className="flex gap-2">
                        <img 
                          src={club.currentBook.book?.coverUrl || '/images/default.webp'}
                          alt={club.currentBook.book?.title}
                          className="w-12 h-16 object-cover rounded"
                          onError={(e) => { e.target.src = '/images/default.webp'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 line-clamp-2">{club.currentBook.book?.title}</p>
                          <p className="text-xs text-gray-600 truncate">{club.currentBook.book?.author}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{club.memberCount || club.members?.length || 0} members</span>
                    {club.activeUsers > 0 && (
                      <span className="text-green-600">{club.activeUsers} online</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Member Book Clubs Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isOwnProfile ? 'Book Clubs I\'m In' : `${profile.name} is a member of`}
          </h2>
          
          {memberBookClubs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-4">
                {isOwnProfile ? "You haven't joined any book clubs yet" : "Not a member of any book clubs"}
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => navigate('/discover')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Browse Book Clubs
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {memberBookClubs.map(club => (
                <div
                  key={club.id}
                  onClick={() => navigate(`/bookclub/${club.id}`)}
                  className="border rounded-lg p-4 hover:shadow-lg cursor-pointer transition-shadow"
                >
                  <img 
                    src={club.imageUrl 
                      ? `${COLLAB_EDITOR_URL}${club.imageUrl}` 
                      : '/images/default.webp'
                    }
                    alt={club.name}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                  />
                  <h3 className="font-semibold text-lg truncate mb-2">{club.name}</h3>
                  
                  {/* Current Book */}
                  {club.currentBook && (
                    <div className="mt-2 mb-2 p-2 bg-purple-50 rounded border border-purple-200">
                      <p className="text-xs text-purple-600 font-semibold mb-1">📖 Currently Reading</p>
                      <div className="flex gap-2">
                        <img 
                          src={club.currentBook.book?.coverUrl || '/images/default.webp'}
                          alt={club.currentBook.book?.title}
                          className="w-12 h-16 object-cover rounded"
                          onError={(e) => { e.target.src = '/images/default.webp'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 line-clamp-2">{club.currentBook.book?.title}</p>
                          <p className="text-xs text-gray-600 truncate">{club.currentBook.book?.author}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {club.members && club.members.length > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex -space-x-2">
                        {club.members.slice(0, 3).map((member, idx) => (
                          <img 
                            key={idx}
                            src={getProfileImageUrl(member.profileImage) || '/images/default.webp'}
                            alt=""
                            className="w-6 h-6 rounded-full border-2 border-white object-cover"
                            onError={(e) => { e.target.src = '/images/default.webp'; }}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {club.members.length} {club.members.length === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    {club.activeUsers || 0} online
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Books Section */}
        {(favoriteBooks.length > 0 || booksImReading.length > 0 || booksToRead.length > 0 || booksRead.length > 0 || isOwnProfile) && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {isOwnProfile ? 'My Library' : `${profile.name}'s Library`}
              </h2>
              {isOwnProfile && (
                <button
                  onClick={() => setShowAddBookModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
                >
                  <FiPlus size={20} />
                  Add Books
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-3">
              {[
                { key: 'all', label: 'All', count: favoriteBooks.length + booksImReading.length + booksToRead.length + booksRead.length },
                { key: 'reading', label: 'Currently Reading', count: booksImReading.length },
                { key: 'want_to_read', label: 'Want to Read', count: booksToRead.length },
                { key: 'completed', label: 'Read', count: booksRead.length },
                { key: 'favorite', label: 'Favorites', count: favoriteBooks.length },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setBookFilter(tab.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    bookFilter === tab.key
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 text-xs ${
                    bookFilter === tab.key ? 'text-purple-200' : 'text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Filtered Book Grid */}
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

              const shelfLabel = { favorite: 'Favorite', reading: 'Reading', want_to_read: 'Want to Read', completed: 'Read' };
              const shelfColor = { favorite: 'text-red-500', reading: 'text-green-500', want_to_read: 'text-blue-500', completed: 'text-purple-500' };

              if (filteredBooks.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-400">
                    <p>
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {filteredBooks.map(userBook => (
                    <div key={userBook.id} className="group relative">
                      <img
                        src={userBook.book.coverUrl || '/images/default.webp'}
                        alt={userBook.book.title}
                        className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow"
                        onError={(e) => { e.target.src = '/images/default.webp'; }}
                      />
                      {/* Action Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all rounded-lg flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                        {isOwnProfile && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const ok = await confirm('Remove this book from your library?', { title: 'Remove Book', variant: 'danger', confirmLabel: 'Remove' });
                              if (ok) DeleteUserBook(userBook.id);
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors shadow-lg"
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
                          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg"
                        >
                          <FiInfo size={24} />
                        </button>
                      </div>
                      <h4 className="mt-2 text-sm font-medium line-clamp-2">{userBook.book.title}</h4>
                      <p className="text-xs text-gray-600">{userBook.book.author}</p>
                      {bookFilter === 'all' && (
                        <p className={`text-xs font-medium mt-0.5 ${shelfColor[userBook._shelf]}`}>
                          {shelfLabel[userBook._shelf]}
                        </p>
                      )}
                      {userBook.rating && (
                        <p className="text-xs text-yellow-600">{'⭐'.repeat(userBook.rating)}</p>
                      )}
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
              await fetchBooks();
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