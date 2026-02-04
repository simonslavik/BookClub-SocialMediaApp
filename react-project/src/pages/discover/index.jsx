import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiUsers, FiBook, FiX, FiLock, FiUnlock, FiEyeOff } from 'react-icons/fi';
import HomePageHeader from '../../components/layout/Header';
import { AuthContext } from '../../context';
import { bookclubAPI } from '../../api/bookclub.api';
import JoinBookclubModal from '../../components/common/modals/JoinBookclubModal';

const categories = [
    'All',
    'General',
    'Fiction',
    'Non-Fiction',
    'Mystery',
    'Romance',
    'Science Fiction',
    'Fantasy',
    'Thriller',
    'Biography',
    'Self-Help',
    'History',
    'Poetry',
    'Young Adult',
    'Classic Literature',
    'Horror',
    'Philosophy'
];

const DiscoverBookClubs = () => {
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [bookClubs, setBookClubs] = useState([]);
    const [filteredBookClubs, setFilteredBookClubs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [selectedBookclub, setSelectedBookclub] = useState(null);

    // Fetch all bookclubs
    useEffect(() => {
        const fetchBookclubs = async () => {
            try {
                const response = await bookclubAPI.discoverBookclubs(
                    selectedCategory === 'All' ? undefined : selectedCategory
                );
                
                console.log('Fetched bookclubs:', response);
                const clubs = response.data || [];
                setBookClubs(clubs);
                setFilteredBookClubs(clubs);
            } catch (error) {
                console.error('Error fetching book clubs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookclubs();
    }, [selectedCategory]);

    // Filter bookclubs based on search query only (category filtering happens in API call)
    useEffect(() => {
        let filtered = [...bookClubs];

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(club =>
                club.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredBookClubs(filtered);
    }, [searchQuery, bookClubs]);

    const handleClearSearch = () => {
        setSearchQuery('');
    };

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
    };

    const handleBookclubClick = (bookClub, e) => {
        e.stopPropagation();
        
        // If user is not authenticated, navigate to preview page
        if (!auth?.user) {
            navigate(`/bookclubpage/${bookClub.id}`);
            return;
        }
        
        // If user is already a member, navigate to bookclub chat page
        if (bookClub.isMember) {
            navigate(`/bookclub/${bookClub.id}`);
        } else {
            // Show join modal for non-members
            setSelectedBookclub(bookClub);
            setShowJoinModal(true);
        }
    };

    const handleJoinSuccess = async (memberData) => {
        // Refresh bookclubs list
        try {
            const response = await bookclubAPI.discoverBookclubs(
                selectedCategory === 'All' ? undefined : selectedCategory
            );
            const clubs = response.data || [];
            setBookClubs(clubs);
            setFilteredBookClubs(clubs);
        } catch (error) {
            console.error('Error refreshing book clubs:', error);
        }
        
        // Navigate to club
        if (selectedBookclub) {
            navigate(`/bookclub/${selectedBookclub.id}`);
        }
    };

    const getVisibilityIcon = (visibility) => {
        switch (visibility) {
            case 'PUBLIC':
                return <FiUnlock className="w-4 h-4" />;
            case 'PRIVATE':
                return <FiLock className="w-4 h-4" />;
            case 'INVITE_ONLY':
                return <FiEyeOff className="w-4 h-4" />;
            default:
                return <FiUnlock className="w-4 h-4" />;
        }
    };

    const getVisibilityColor = (visibility) => {
        switch (visibility) {
            case 'PUBLIC':
                return 'bg-green-100 text-green-700';
            case 'PRIVATE':
                return 'bg-yellow-100 text-yellow-700';
            case 'INVITE_ONLY':
                return 'bg-purple-100 text-purple-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <HomePageHeader />
            
            <div className="pt-20 pb-12">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
                    <div className="max-w-7xl mx-auto px-6">
                        <h1 className="text-5xl font-display font-bold mb-4">Discover Book Clubs</h1>
                        <p className="text-xl text-white/90 font-outfit">Find your perfect reading community</p>
                    </div>
                </div>

                {/* Search and Filter Section */}
                <div className="max-w-7xl mx-auto px-6 -mt-8">
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        {/* Search Bar */}
                        <div className="relative mb-6">
                            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                            <input
                                type="text"
                                placeholder="Search for book clubs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl font-outfit focus:border-purple-500 focus:outline-none text-lg"
                            />
                            {searchQuery && (
                                <button
                                    onClick={handleClearSearch}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <FiX className="text-xl" />
                                </button>
                            )}
                        </div>

                        {/* Category Filter */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <FiFilter className="text-gray-600" />
                                <h3 className="font-semibold text-gray-900 font-outfit">Filter by Category</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => handleCategoryClick(category)}
                                        className={`px-4 py-2 rounded-full font-outfit text-sm transition-all ${
                                            selectedCategory === category
                                                ? 'bg-purple-600 text-white shadow-lg scale-105'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="max-w-7xl mx-auto px-6 mt-8">
                    {/* Results Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 font-display">
                            {filteredBookClubs.length} Book Club{filteredBookClubs.length !== 1 ? 's' : ''} Found
                        </h2>
                        {(searchQuery || selectedCategory !== 'All') && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('All');
                                }}
                                className="text-purple-600 hover:text-purple-700 font-outfit font-medium"
                            >
                                Clear All Filters
                            </button>
                        )}
                    </div>

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
                        </div>
                    ) : filteredBookClubs.length === 0 ? (
                        /* Empty State */
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">📚</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2 font-display">No Book Clubs Found</h3>
                            <p className="text-gray-600 mb-6 font-outfit">
                                {searchQuery || selectedCategory !== 'All'
                                    ? 'Try adjusting your search or filters'
                                    : 'Be the first to create a book club!'}
                            </p>
                            <button
                                onClick={() => navigate('/create-bookclub')}
                                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors font-outfit"
                            >
                                Create a Book Club
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredBookClubs.map(bookClub => (
                                <div
                                    key={bookClub.id}
                                    onClick={(e) => handleBookclubClick(bookClub, e)}
                                    className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden transform hover:scale-105 w-full h-[420px] flex flex-col"
                                >
                                    {/* Book Club Image */}
                                    <div className="relative h-48 bg-gradient-to-br from-purple-400 to-blue-400">
                                        <img
                                            src={bookClub.imageUrl ? `http://localhost:4000${bookClub.imageUrl}` : '/images/default.webp'}
                                            alt={bookClub.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = '/images/default.webp'; }}
                                        />
                                        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                                            {bookClub.category && (
                                                <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-purple-700 font-outfit">
                                                    {bookClub.category}
                                                </div>
                                            )}
                                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getVisibilityColor(bookClub.visibility)}`}>
                                                {getVisibilityIcon(bookClub.visibility)}
                                                {bookClub.visibility}
                                            </div>
                                        </div>
                                        {bookClub.isMember && (
                                            <div className="absolute bottom-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                                ✓ Member
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 font-display">
                                            {bookClub.name}
                                        </h3>

                                        {bookClub.description && (
                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2 font-outfit">
                                                {bookClub.description}
                                            </p>
                                        )}

                                        {/* Stats */}
                                        <div className="mt-auto space-y-2">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <FiUsers className="text-purple-600" />
                                                <span className="text-sm font-outfit">
                                                    {bookClub.memberCount || 0} member{bookClub.memberCount !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Join Modal */}
            <JoinBookclubModal
                isOpen={showJoinModal}
                onClose={() => setShowJoinModal(false)}
                bookclub={selectedBookclub}
                onJoinSuccess={handleJoinSuccess}
            />
        </div>
    );
};

export default DiscoverBookClubs;
