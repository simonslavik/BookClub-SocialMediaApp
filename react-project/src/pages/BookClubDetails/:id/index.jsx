


import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiUsers, FiBook, FiCalendar, FiMessageSquare, FiStar, FiArrowRight, FiClock, FiTrendingUp } from 'react-icons/fi';
import HomePageHeader from '../../../components/layout/Header';
import AuthContext from '../../../context';

const BookClubPage = () => {
    const { id: bookClubId } = useParams();
    const navigate = useNavigate();
    const { auth } = useContext(AuthContext);
    
    const [bookClub, setBookClub] = useState(null);
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [bookClubMembers, setBookClubMembers] = useState([]);
    const [currentBook, setCurrentBook] = useState(null);
    const [upcomingBooks, setUpcomingBooks] = useState([]);
    const [completedBooks, setCompletedBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch bookclub details
    useEffect(() => {
        const fetchBookClub = async () => {
            try {
                const headers = auth?.token 
                    ? { Authorization: `Bearer ${auth.token}` }
                    : {};
                
                // Use preview endpoint for non-members, or full endpoint for members
                const endpoint = auth?.token 
                    ? `http://localhost:3000/v1/bookclubs/${bookClubId}`
                    : `http://localhost:3000/v1/bookclubs/${bookClubId}/preview`;
                    
                const response = await fetch(endpoint, { headers });
                const responseData = await response.json();
                
                if (response.ok) {
                    // Handle new API response format { success: true, data: {...} }
                    const data = responseData.success ? responseData.data : responseData;
                    setBookClub(data);
                    setConnectedUsers(data.connectedUsers || []);
                    setBookClubMembers(data.members || []);
                } else {
                    setError(responseData.message || responseData.error || 'Failed to load book club');
                }
            } catch (err) {
                console.error('Error fetching book club:', err);
                setError('Failed to connect to server');
            } finally {
                setLoading(false);
            }
        };

        if (bookClubId) {
            fetchBookClub();
        }
    }, [bookClubId, auth]);

    // Fetch books
    useEffect(() => {
        const fetchBooks = async () => {
            if (!auth?.token || !bookClubId) return;
            
            try {
                const response = await fetch(
                    `http://localhost:3000/v1/bookclub/${bookClubId}/books`,
                    {
                        headers: {
                            'Authorization': `Bearer ${auth.token}`
                        }
                    }
                );
                const data = await response.json();
                
                if (data.success) {
                    setCurrentBook(data.data.find(book => book.status === 'current') || null);
                    setUpcomingBooks(data.data.filter(book => book.status === 'upcoming'));
                    setCompletedBooks(data.data.filter(book => book.status === 'completed').slice(0, 3));
                }
            } catch (err) {
                console.error('Error fetching books:', err);
            }
        };

        fetchBooks();
    }, [bookClubId, auth]);

    const calculateDaysRemaining = () => {
        if (!currentBook?.endDate) return 0;
        const today = new Date();
        const end = new Date(currentBook.endDate);
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    };

    const calculateProgress = () => {
        if (!currentBook?.startDate || !currentBook?.endDate) return 0;
        const start = new Date(currentBook.startDate);
        const end = new Date(currentBook.endDate);
        const today = new Date();
        const total = end - start;
        const elapsed = today - start;
        const percentage = Math.min(100, Math.max(0, (elapsed / total) * 100));
        return Math.round(percentage);
    };

    if (loading) {
        return (
            <>
                <HomePageHeader />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-lg text-gray-600">Loading book club...</p>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <HomePageHeader />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
                    <div className="text-center">
                        <div className="text-red-500 text-6xl mb-4">⚠️</div>
                        <p className="text-lg text-red-600 mb-4">{error}</p>
                        <button 
                            onClick={() => navigate('/')}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Go Home
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <HomePageHeader />
            <div className="min-h-screen bg-gray-50 pt-20">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    <div className="max-w-7xl mx-auto px-6 py-12">
                        <div className="flex items-center gap-8">
                            {/* BookClub Image */}
                            <div className="flex-shrink-0">
                                {bookClub?.imageUrl ? (
                                    <img
                                        src={`http://localhost:4000${bookClub.imageUrl}`}
                                        alt={bookClub.name}
                                        className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-2xl"
                                        onError={(e) => { e.target.src = '/images/default.webp'; }}
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-2xl bg-white/20 flex items-center justify-center border-4 border-white shadow-2xl">
                                        <FiBook className="text-white text-5xl" />
                                    </div>
                                )}
                            </div>

                            {/* BookClub Info */}
                            <div className="flex-1">
                                <h1 className="text-4xl font-bold mb-3">{bookClub?.name}</h1>
                                <div className="flex items-center gap-6 text-white/90">
                                    <div className="flex items-center gap-2">
                                        <FiUsers size={20} />
                                        <span>{bookClubMembers.length} member{bookClubMembers.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FiBook size={20} />
                                        <span>{(completedBooks.length + (currentBook ? 1 : 0) + upcomingBooks.length)} books</span>
                                    </div>
                                    {currentBook && (
                                        <div className="flex items-center gap-2">
                                            <FiClock size={20} />
                                            <span>{calculateDaysRemaining()} days left</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={() => navigate(`/bookclub/${bookClubId}`)}
                                className="px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all transform hover:scale-105 shadow-xl flex items-center gap-2"
                            >
                                <FiMessageSquare size={20} />
                                Enter BookClub
                                <FiArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Current Book & Activity */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Current Book Section */}
                            {currentBook ? (
                                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-4">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                            <FiBook />
                                            Currently Reading
                                        </h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex gap-6">
                                            <img
                                                src={currentBook.book?.coverUrl || '/images/default.webp'}
                                                alt={currentBook.book?.title}
                                                className="w-32 h-48 object-cover rounded-lg shadow-md flex-shrink-0"
                                                onError={(e) => { e.target.src = '/images/default.webp'; }}
                                            />
                                            <div className="flex-1">
                                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                                    {currentBook.book?.title}
                                                </h3>
                                                <p className="text-lg text-gray-600 mb-4">
                                                    {currentBook.book?.author}
                                                </p>
                                                
                                                {/* Progress Bar */}
                                                <div className="mb-4">
                                                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                                                        <span>Reading Progress</span>
                                                        <span className="font-semibold text-purple-600">{calculateProgress()}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                                        <div
                                                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all"
                                                            style={{ width: `${calculateProgress()}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Timeline */}
                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div className="bg-purple-50 rounded-lg p-3">
                                                        <p className="text-xs text-gray-600 mb-1">Started</p>
                                                        <p className="font-semibold text-purple-600">
                                                            {new Date(currentBook.startDate).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="bg-blue-50 rounded-lg p-3">
                                                        <p className="text-xs text-gray-600 mb-1">Target Finish</p>
                                                        <p className="font-semibold text-blue-600">
                                                            {new Date(currentBook.endDate).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Stats */}
                                                <div className="flex gap-4">
                                                    <div className="text-center">
                                                        <p className="text-2xl font-bold text-purple-600">
                                                            {currentBook.book?.pageCount || '?'}
                                                        </p>
                                                        <p className="text-xs text-gray-600">Total Pages</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-2xl font-bold text-blue-600">
                                                            {calculateDaysRemaining()}
                                                        </p>
                                                        <p className="text-xs text-gray-600">Days Left</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                                    <FiBook className="mx-auto text-6xl text-gray-300 mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Current Book</h3>
                                    <p className="text-gray-600">This bookclub hasn't selected a book to read yet.</p>
                                </div>
                            )}

                            {/* Upcoming Books */}
                            {upcomingBooks.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                            <FiCalendar />
                                            Coming Up Next
                                        </h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {upcomingBooks.slice(0, 4).map((bookClubBook) => (
                                                <div key={bookClubBook.id} className="flex gap-3 bg-blue-50 rounded-lg p-3 hover:shadow-md transition-shadow">
                                                    <img
                                                        src={bookClubBook.book?.coverUrl || '/images/default.webp'}
                                                        alt={bookClubBook.book?.title}
                                                        className="w-16 h-24 object-cover rounded shadow-sm"
                                                        onError={(e) => { e.target.src = '/images/default.webp'; }}
                                                    />
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-900 line-clamp-2 text-sm mb-1">
                                                            {bookClubBook.book?.title}
                                                        </h4>
                                                        <p className="text-xs text-gray-600 mb-2">
                                                            {bookClubBook.book?.author}
                                                        </p>
                                                        {bookClubBook.startDate && (
                                                            <p className="text-xs text-blue-600 font-medium">
                                                                Starts {new Date(bookClubBook.startDate).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Completed Books */}
                            {completedBooks.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                            <FiStar />
                                            Recently Completed
                                        </h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-3 gap-4">
                                            {completedBooks.map((bookClubBook) => (
                                                <div key={bookClubBook.id} className="text-center">
                                                    <img
                                                        src={bookClubBook.book?.coverUrl || '/images/default.webp'}
                                                        alt={bookClubBook.book?.title}
                                                        className="w-full h-40 object-cover rounded-lg shadow-md mb-2 hover:scale-105 transition-transform"
                                                        onError={(e) => { e.target.src = '/images/default.webp'; }}
                                                    />
                                                    <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">
                                                        {bookClubBook.book?.title}
                                                    </h4>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Members & Stats */}
                        <div className="space-y-8">
                            {/* Members Section */}
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <FiUsers />
                                        Members ({bookClubMembers.length})
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {bookClubMembers.slice(0, 10).map((member) => {
                                            const isOnline = connectedUsers.some(u => u.userId === member.id);
                                            return (
                                                <div
                                                    key={member.id}
                                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
                                                    onClick={() => navigate(`/profile/${member.id}`)}
                                                >
                                                    <div className="relative">
                                                        <img
                                                            src={member.profileImage 
                                                                ? `http://localhost:3001${member.profileImage}` 
                                                                : '/images/default.webp'
                                                            }
                                                            alt={member.username}
                                                            className="w-12 h-12 rounded-full object-cover"
                                                            onError={(e) => { e.target.src = '/images/default.webp'; }}
                                                        />
                                                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                                            isOnline ? 'bg-green-500' : 'bg-gray-400'
                                                        }`}></div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-900">{member.username}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {isOnline ? '🟢 Online' : 'Offline'}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {bookClubMembers.length > 10 && (
                                        <p className="text-center text-sm text-gray-500 mt-3">
                                            +{bookClubMembers.length - 10} more members
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Stats Card */}
                            <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl shadow-lg p-6 text-white">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <FiTrendingUp />
                                    BookClub Stats
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/80">Total Books</span>
                                        <span className="text-2xl font-bold">
                                            {completedBooks.length + (currentBook ? 1 : 0) + upcomingBooks.length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/80">Completed</span>
                                        <span className="text-2xl font-bold">{completedBooks.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/80">Upcoming</span>
                                        <span className="text-2xl font-bold">{upcomingBooks.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/80">Active Members</span>
                                        <span className="text-2xl font-bold">{connectedUsers.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default BookClubPage