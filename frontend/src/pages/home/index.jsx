import AuthContext from '@context/index';
import { useContext, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import HomePageHeader from '@components/layout/Header';
import { getProfileImageUrl, getCollabImageUrl } from '@config/constants';
import { useTheme } from '@context/ThemeContext';
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
    const [hoveredMember, setHoveredMember] = useState(null);
    const [cardBookIndex, setCardBookIndex] = useState({}); // { [clubId]: index }

    const navigate = useNavigate();
    const { isDark } = useTheme();
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
            fetchSuggestedUsers();
        }
        
        // Always fetch all public bookclubs using discover API
        apiClient.get('/v1/bookclubs/discover')
            .then(async response => {
                const responseData = response.data;
                logger.debug('All Bookclubs response:', responseData);
                // Handle new API response format { success: true, data: [...] }
                const clubs = responseData.success ? responseData.data : (responseData.bookClubs || []);
                
                // Fetch current books for all clubs in batch
                let clubsWithBooks = clubs;
                try {
                    const clubIds = clubs.map(c => c.id);
                    if (clubIds.length > 0) {
                        const booksRes = await apiClient.post('/v1/bookclub/batch-current-books', { bookClubIds: clubIds });
                        if (booksRes.data?.success && Array.isArray(booksRes.data.currentBooks)) {
                            const booksMap = new Map(
                                booksRes.data.currentBooks.map(b => [b.bookClubId, b.currentBooks || []])
                            );
                            clubsWithBooks = clubs.map(club => ({
                                ...club,
                                currentBooks: booksMap.get(club.id) || [],
                            }));
                        }
                    }
                } catch (err) {
                    logger.error('Error fetching batch current books:', err);
                }
                
                setBookClubs(clubsWithBooks);
                
                if (auth?.user) {
                    // Collect all bookclubs the user belongs to (created + joined)
                    const myClubs = clubsWithBooks.filter(club => 
                        club.creatorId === auth.user.id || club.isMember === true
                    );
                    setAllMyBookClubs(myClubs);
                    
                    // Get suggested users from all bookclubs user is in
                    const allUserBookClubs = clubsWithBooks.filter(club => club.isMember === true);
                    
                    // Suggested users are now fetched from a dedicated endpoint
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

    const fetchSuggestedUsers = async () => {
        if (!auth?.token) return;
        try {
            const response = await apiClient.get('/v1/users/suggestions?limit=12');
            setSuggestedUsers(response.data?.data || []);
        } catch (err) {
            logger.error('Error fetching suggested users:', err);
        }
    };



    return (
        <div>
            <HomePageHeader />

            {/* ===== LOGGED-OUT LANDING PAGE ===== */}
            {!auth?.user && (
                <div className="min-h-screen bg-warmgray-50 dark:bg-gray-900 transition-colors duration-300">
                    {/* Hero Section */}
                    <section className="relative overflow-hidden px-6 md:px-16 py-16 md:py-28">
                        {/* Background watermark text */}
                        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-[0.06] dark:opacity-[0.04]  pt-1">
                            <p className="text-[1rem] md:text-[1.1rem] leading-relaxed text-stone-800 dark:text-warmgray-200 font-serif">
                                Books are the quietest and most constant of friends; they are the most accessible and wisest of counselors, and the most patient of teachers. A reader lives a thousand lives before he dies. The man who never reads lives only one. Reading is to the mind what exercise is to the body. There is no <br></br>friend as loyal as a book. A book is a dream that you hold in your hand. Once you learn to read, you will be forever free. The more that you read, the more things you will know. The more that you learn, the more places you'll go. Reading gives us someplace to go when we have to stay where we are. A room without books is like a body without a soul.
                                Lorem ipsum, dolor sit amet consectetur adipisici<br></br>ng elit. Minus assumenda 
                                porro, possimus placeat ipsam rem est voluptatem iste. Dolore officia exc
                                epturi ut ex aut repudiandae similique fugiat rem voluptatem doloremque blanditiis quo ad aspernatur, veritatis quisquam sunt velit consequatur architecto iusto facilis tota<br></br>m quas. Unde facilis dolores architecto voluptas tenetur ipsam quos dolor odio fuga quidem ab ad mollitia omnis accusantium, necessitatibus pariatur eligendi illum rem sunt facere sequi suscipit! Adipisci, obcaecati? Sapiente architecto voluptatem et eos doloribus adipisci, vitae reiciendis, esse sed blanditiis voluptatum modi, aliquam aspernatur. Ipsam delectus eaque unde esse magni mollitia laborum dolore iste aut alias?
                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Cum quaerat, ip<br></br>sa officiis dolore provident soluta excepturi, accusantium inventore dolor, nemo totam? Numquam veritatis ad, aliquam dignissimos aliquid nam dolorum atque repellat? Aliquid, laborum reiciendis ex<br></br>pedita, libero laboriosam rem unde perspiciatis fugiat maxime pariatur ipsam, molestias doloremque modi! Eius ex perferendis natus numquam similique volupta<br></br>te dolore quas. Reprehenderit nihil neque in eaque architecto eius debitis asperiores dolor, distinctio tempora est dolorem at quis placeat libero quo ipsa quod pariatur voluptate. Voluptate, earum! Laudantium explicabo, aut molestiae placeat rerum asperiores est soluta eligendi fugiat porro aliquid atque minima cum, dicta quia deleniti ex quisquam. Tempore commodi minus, rem, enim voluptate corporis explicabo nam facilis ipsam hic fugiat, excepturi placeat perspiciatis eos maiores necessitatibus voluptatem voluptatum laudantium pariatur deserunt in. Obcaecati, necessitatibus. Laboriosam cum eaque ullam, modi id fuga illo quo tenetur harum dicta aut totam expedita vel. Laudantium consequatur necessitatibus numquam, laborum placeat eum mollitia, ipsam iusto ab perspiciatis inventore ipsum modi qui, illum ratione sit sunt exercitationem dolorem debitis voluptatem. Corrupti quaerat sequi sit non nam delectus. Volup
                                tas perspiciatis magni vitae aspernatur deleniti, fugiat delectus nam corporis, molestiae at aperi<br>
                                </br>am exercitationem!

                            </p>
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-16">
                            <div className="w-full md:w-1/2">
                                <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] text-stone-900 dark:text-warmgray-100 tracking-tight">
                                    &ldquo;Connect With<br />Your Fellow<br />BookLovers&rdquo;
                                </h1>
                            </div>

                            {/* Image placeholder */}
                            <div className="w-full md:w-1/2 aspect-[4/3] bg-stone-700 dark:bg-gray-700 rounded-sm overflow-hidden">
                                <div className="w-full h-full bg-stone-700 dark:bg-gray-700" />
                            </div>
                        </div>
                    </section>

                    {/* Feature Section */}
                    <section className="bg-warmgray-100 dark:bg-gray-800 transition-colors duration-300">
                        <div className="max-w-6xl mx-auto px-6 md:px-16 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10 md:gap-16">
                            {/* Image placeholder */}
                            <div className="w-full md:w-1/2 aspect-[4/3] bg-warmgray-400 dark:bg-gray-600 rounded-sm overflow-hidden">
                                <div className="w-full h-full bg-warmgray-400 dark:bg-gray-600" />
                            </div>

                            {/* Text */}
                            <div className="w-full md:w-1/2">
                                <p className="text-xl md:text-2xl leading-relaxed text-stone-800 dark:text-warmgray-200 font-serif">
                                    <span className="text-5xl md:text-6xl font-display font-bold float-left mr-2 leading-[0.85] mt-1 text-stone-900 dark:text-warmgray-100">C</span>
                                    reate your own bookclub channel and have whole bookloving community together.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Feature Section 2 — text left, image right */}
                    <section className="bg-warmgray-50 dark:bg-gray-900 transition-colors duration-300">
                        <div className="max-w-6xl mx-auto px-6 md:px-16 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10 md:gap-16">
                            {/* Text */}
                            <div className="w-full md:w-1/2 order-2 md:order-1">
                                <p className="text-xl md:text-2xl leading-relaxed text-stone-800 dark:text-warmgray-200 font-serif">
                                    <span className="text-5xl md:text-6xl font-display font-bold float-left mr-2 leading-[0.85] mt-1 text-stone-900 dark:text-warmgray-100">D</span>
                                    iscover new reads, share reviews, and discuss your favorite chapters with readers who get&nbsp;it.
                                </p>
                            </div>

                            {/* Image placeholder */}
                            <div className="w-full md:w-1/2 aspect-[4/3] bg-warmgray-400 dark:bg-gray-600 rounded-sm overflow-hidden order-1 md:order-2">
                                <div className="w-full h-full bg-warmgray-400 dark:bg-gray-600" />
                            </div>
                        </div>
                    </section>

                    <section className="bg-warmgray-100 dark:bg-gray-800 transition-colors duration-300">
                        <div className="max-w-6xl mx-auto px-6 md:px-16 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10 md:gap-16">
                            {/* Image placeholder */}
                            <div className="w-full md:w-1/2 aspect-[4/3] bg-warmgray-400 dark:bg-gray-600 rounded-sm overflow-hidden">
                                <div className="w-full h-full bg-warmgray-400 dark:bg-gray-600" />
                            </div>

                            {/* Text */}
                            <div className="w-full md:w-1/2">
                                <p className="text-xl md:text-2xl leading-relaxed text-stone-800 dark:text-warmgray-200 font-serif">
                                    <span className="text-5xl md:text-6xl font-display font-bold float-left mr-2 leading-[0.85] mt-1 text-stone-900 dark:text-warmgray-100">C</span>
                                    reate your own bookclub channel and have whole bookloving community together.
                                </p>
                            </div>
                        </div>
                    </section>

        

                    {/* Top Charting BookClubs Section */}
                    <section className="px-6 md:px-16 py-16 md:py-24">
                        <div className="max-w-5xl mx-auto text-center">
                            <h2 className="font-display text-4xl md:text-5xl font-bold text-stone-900 dark:text-warmgray-100 mb-2 leading-tight">
                                Top Charting
                            </h2>
                            <p className="font-serif text-lg text-stone-500 dark:text-warmgray-400 mb-12 italic">
                                BookClubs people love right now
                            </p>

                            <div className="flex flex-wrap justify-center gap-5 md:gap-8">
                                {(() => {
                                    const topClubs = [...bookClubs]
                                        .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
                                        .slice(0, 4);

                                    if (topClubs.length === 0) {
                                        return Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="flex flex-col items-center w-40 sm:w-48">
                                                <div className="w-full aspect-[3/4] bg-warmgray-200 dark:bg-gray-700 rounded-lg" />
                                                <div className="mt-3 h-4 w-24 bg-warmgray-200 dark:bg-gray-700 rounded" />
                                            </div>
                                        ));
                                    }

                                    return topClubs.map((club) => (
                                        <button
                                            key={club.id}
                                            onClick={() => navigate(`/bookclubpage/${club.id}`)}
                                            className="flex flex-col items-center group cursor-pointer w-40 sm:w-48"
                                        >
                                            <div className="w-full aspect-[3/4] bg-warmgray-200 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow duration-300">
                                                <img
                                                    src={getCollabImageUrl(club.image) || '/images/default.webp'}
                                                    alt={club.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                                                />
                                            </div>
                                            <p className="mt-3 text-sm font-semibold text-stone-800 dark:text-warmgray-200 line-clamp-1 group-hover:text-stone-600 dark:group-hover:text-white transition-colors">
                                                {club.name}
                                            </p>
                                            <p className="text-xs text-stone-400 dark:text-gray-500 mt-0.5">
                                                {club.memberCount || 0} members
                                            </p>
                                        </button>
                                    ));
                                })()}
                            </div>
                        </div>
                    </section>

                    {/* Discover More CTA */}
                    <section className="flex justify-center pb-20">
                        <button
                            onClick={() => navigate('/discover')}
                            className="px-8 py-3 bg-stone-600 dark:bg-warmgray-300 dark:text-stone-900 text-white rounded-md hover:bg-stone-500 dark:hover:bg-warmgray-400 transition-colors text-sm font-medium cursor-pointer"
                        >
                            Discover More
                        </button>
                    </section>
                </div>
            )}

            {/* ===== LOGGED-IN DASHBOARD ===== */}
            {auth?.user && (
            <div className="flex flex-col p-4 md:p-8 w-full min-h-screen gap-4 bg-warmgray-50 dark:bg-gray-900 transition-colors duration-300">
                    <div className="flex flex-col p-4 rounded w-full">
                        {/* Header with title and filter */}
                        <div className="flex items-center justify-end mb-4">
                            <button
                                onClick={() => { setFilterCreatedByMe(prev => !prev); setCarouselIndex(0); }}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                    filterCreatedByMe
                                        ? 'bg-stone-600 text-white'
                                        : 'bg-warmgray-200 dark:bg-gray-700 text-stone-600 dark:text-warmgray-300 hover:bg-warmgray-300 dark:hover:bg-gray-600'
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
                                    <div className="flex flex-col items-center justify-center py-2 text-gray-500">
                                        <p className="mb-5">
                                            {filterCreatedByMe
                                                ? "You haven't created any bookclubs yet."
                                                : "You're not in any bookclubs yet."}
                                        </p>
                                        <div
                                            onClick={createNewBookClub}
                                            className="w-[300px] h-[440px] rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ease-out group hover:shadow-xl"
                                            style={{
                                                background: '#faf9f7',
                                                border: '2px dashed',
                                                borderColor: '#1d1104',
                                                boxShadow: '0 12px 40px rgba(180, 160, 130, 0.15)',
                                            }}
                                        >
                                            <div className="w-16 h-16 rounded-full bg-stone-100 group-hover:bg-stone-200 flex items-center justify-center transition-colors mb-3">
                                                <span className="text-3xl text-stone-500 group-hover:text-stone-700 transition-colors">+</span>
                                            </div>
                                            <span className="text-sm text-gray-600 group-hover:text-stone-800 font-semibold transition-colors">Create Book Club</span>
                                        </div>
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
                                            className="w-[240px] sm:w-[300px] h-[360px] sm:h-[440px] flex-shrink-0 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ease-out group"
                                            style={{
                                                transform: `scale(${scale})`,
                                                opacity,
                                                zIndex,
                                                background: isCenter ? '#faf9f7' : '#f5f3f0',
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
                                        className="w-[240px] sm:w-[300px] h-[360px] sm:h-[440px] flex-shrink-0 rounded-2xl flex flex-col cursor-pointer transition-all duration-500 ease-out relative"
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
                                        <div className="relative h-36 sm:h-44 overflow-hidden rounded-t-2xl">
                                            <img
                                                src={bookClub.imageUrl ? getCollabImageUrl(bookClub.imageUrl) : '/images/default.webp'}
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
                                            <h3 className="font-bold text-gray-900 text-lg sm:text-xl leading-tight line-clamp-2">{bookClub.name}</h3>
                                            
                                            {bookClub.description && (
                                                <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">{bookClub.description}</p>
                                            )}

                                            {/* Current Books Mini-Carousel */}
                                            {bookClub.currentBooks && bookClub.currentBooks.length > 0 && (() => {
                                                const books = bookClub.currentBooks;
                                                const bookIdx = cardBookIndex[bookClub.id] || 0;
                                                const currentEntry = books[bookIdx] || books[0];
                                                const hasMultiple = books.length > 1;

                                                return (
                                                    <div className="mt-3 p-2.5 bg-warmgray-50 rounded-lg border border-warmgray-200">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <p className="text-[10px] uppercase tracking-wider text-stone-600 font-bold">Currently Reading</p>
                                                            {hasMultiple && (
                                                                <span className="text-[10px] text-stone-400 font-medium">{bookIdx + 1}/{books.length}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2 items-center">
                                                            {hasMultiple && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setCardBookIndex(prev => ({
                                                                            ...prev,
                                                                            [bookClub.id]: (bookIdx - 1 + books.length) % books.length,
                                                                        }));
                                                                    }}
                                                                    className="flex-shrink-0 w-5 h-5 rounded-full bg-white border border-warmgray-200 flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                                                                >
                                                                    <FiChevronLeft size={12} />
                                                                </button>
                                                            )}
                                                            <img
                                                                src={currentEntry.book?.coverUrl || '/images/default.webp'}
                                                                alt={currentEntry.book?.title}
                                                                className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0"
                                                                onError={(e) => { e.target.src = '/images/default.webp'; }}
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">{currentEntry.book?.title}</p>
                                                                <p className="text-[11px] text-gray-500 truncate mt-0.5">{currentEntry.book?.author}</p>
                                                            </div>
                                                            {hasMultiple && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setCardBookIndex(prev => ({
                                                                            ...prev,
                                                                            [bookClub.id]: (bookIdx + 1) % books.length,
                                                                        }));
                                                                    }}
                                                                    className="flex-shrink-0 w-5 h-5 rounded-full bg-white border border-warmgray-200 flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                                                                >
                                                                    <FiChevronRight size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        {hasMultiple && (
                                                            <div className="flex justify-center gap-1 mt-2">
                                                                {books.map((_, bi) => (
                                                                    <button
                                                                        key={bi}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setCardBookIndex(prev => ({ ...prev, [bookClub.id]: bi }));
                                                                        }}
                                                                        className={`rounded-full transition-all ${
                                                                            bi === bookIdx
                                                                                ? 'w-3 h-1.5 bg-stone-600'
                                                                                : 'w-1.5 h-1.5 bg-stone-300 hover:bg-stone-400'
                                                                        }`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            {(!bookClub.currentBooks || bookClub.currentBooks.length === 0) && !bookClub.description && (
                                                <div className="mt-3 flex-1 flex items-center justify-center">
                                                    <p className="text-sm text-gray-300 italic">No book selected yet</p>
                                                </div>
                                            )}

                                            {/* Members */}
                                            {bookClub.members && bookClub.members.length > 0 && (
                                                <div className="mt-auto pt-3 flex items-center justify-between">
                                                    <div className="flex -space-x-2">
                                                        {bookClub.members.slice(0, 4).map(member => (
                                                            <div key={member.id} className="relative">
                                                                <img
                                                                    src={getProfileImageUrl(member.profileImage) || '/images/default.webp'}
                                                                    alt={member.username}
                                                                    className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm cursor-pointer hover:ring-2 hover:ring-stone-400 transition-all hover:z-10 relative"
                                                                    onClick={(e) => { e.stopPropagation(); navigate(`/profile/${member.id}`); }}
                                                                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                                                                    onMouseEnter={(e) => {
                                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                                        setHoveredMember({
                                                                            id: member.id,
                                                                            name: member.name || member.username,
                                                                            image: getProfileImageUrl(member.profileImage) || '/images/default.webp',
                                                                            x: rect.left + rect.width / 2,
                                                                            y: rect.top,
                                                                        });
                                                                    }}
                                                                    onMouseLeave={() => setHoveredMember(null)}
                                                                />
                                                            </div>
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
                            const cardWidth = window.innerWidth < 640 ? 240 : 300;
                            const gap = window.innerWidth < 640 ? 12 : 20;
                            const stripOffset = -(idx * (cardWidth + gap));

                            return (
                                <div className="relative w-full flex items-center justify-center" style={{ minHeight: window.innerWidth < 640 ? '400px' : '500px' }}>
                                    {/* Left arrow */}
                                    <button
                                        onClick={goPrev}
                                        disabled={idx === 0}
                                        className={`absolute left-2 md:left-40 z-20 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                                            idx === 0
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500 cursor-not-allowed'
                                                : 'bg-white dark:bg-gray-700 shadow-lg text-gray-600 dark:text-gray-300 hover:bg-stone-50 dark:hover:bg-gray-600 hover:text-stone-700 hover:shadow-xl'
                                        }`}
                                    >
                                        <FiChevronLeft size={22} />
                                    </button>

                                    {/* Carousel track */}
                                    <div className="overflow-x-clip overflow-y-visible w-full px-4 md:px-12" style={{ height: window.innerWidth < 640 ? '380px' : '470px' }}>
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
                                        className={`absolute right-2 md:right-40 z-20 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                                            idx === items.length - 1
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500 cursor-not-allowed'
                                                : 'bg-white dark:bg-gray-700 shadow-lg text-gray-600 dark:text-gray-300 hover:bg-stone-50 dark:hover:bg-gray-600 hover:text-stone-700 hover:shadow-xl'
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
                                                        ? 'w-6 h-2.5 bg-stone-700 dark:bg-stone-400'
                                                        : 'w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}


                <div className='flex justify-center mt-8 md:mt-16'>
                    <button 
                        onClick={() => navigate('/discover')}
                        className='font-medium rounded-lg px-5 py-2.5 bg-stone-800 text-white cursor-pointer hover:bg-stone-700 transition-colors text-sm'
                    >
                        Discover More Book Clubs
                    </button>
                </div>

                {/* Most Popular Book Clubs */}
                {(() => {
                    const popularClubs = [...bookClubs]
                        .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
                        .slice(0, 5);

                    if (popularClubs.length === 0) return null;

                    // Tournament bracket: 1st in center (largest), 2nd & 3rd flanking, 4th & 5th on edges
                    const bracketOrder = [popularClubs[3], popularClubs[1], popularClubs[0], popularClubs[2], popularClubs[4]].filter(Boolean);

                    const rankStyles = {
                        0: { size: 'w-36 h-44', ring: 'ring-4 ring-yellow-400', badge: 'bg-yellow-500', emoji: '👑', textSize: 'text-sm' },
                        1: { size: 'w-28 h-36', ring: 'ring-2 ring-gray-300', badge: 'bg-gray-400', emoji: '🥈', textSize: 'text-xs' },
                        2: { size: 'w-28 h-36', ring: 'ring-2 ring-amber-600', badge: 'bg-amber-600', emoji: '🥉', textSize: 'text-xs' },
                        3: { size: 'w-24 h-32', ring: 'ring-1 ring-stone-300', badge: 'bg-stone-400', emoji: '', textSize: 'text-xs' },
                        4: { size: 'w-24 h-32', ring: 'ring-1 ring-stone-300', badge: 'bg-stone-400', emoji: '', textSize: 'text-xs' },
                    };

                    return (
                        <div className="mt-10 md:mt-16">
                            <h3 className="text-lg font-bold text-stone-800 dark:text-warmgray-100 mb-6 text-center">
                                🔥 Most Popular Book Clubs
                            </h3>
                            <div className="flex items-end justify-center gap-2 sm:gap-4 flex-wrap">
                                {bracketOrder.map((club) => {
                                    const originalIdx = popularClubs.indexOf(club);
                                    const rank = originalIdx;
                                    const style = rankStyles[rank];
                                    const isFirst = rank === 0;

                                    return (
                                        <button
                                            key={club.id}
                                            onClick={() => navigate(`/bookclubpage/${club.id}`)}
                                            className={`${style.size} flex flex-col items-center justify-end p-2 bg-white dark:bg-gray-800 rounded-xl border border-warmgray-200 dark:border-gray-700 hover:shadow-lg hover:border-stone-400 dark:hover:border-gray-500 transition-all cursor-pointer group relative ${isFirst ? 'mb-2' : ''}`}
                                        >
                                            {/* Rank badge */}
                                            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${style.badge} text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md`}>
                                                {style.emoji || (rank + 1)}
                                            </div>

                                            {/* Club image */}
                                            <img
                                                src={getCollabImageUrl(club.image) || '/images/default.webp'}
                                                alt={club.name}
                                                className={`${isFirst ? 'w-14 h-14' : 'w-10 h-10'} rounded-full object-cover ${style.ring} shadow-md mb-2`}
                                                onError={(e) => { e.target.src = '/images/default.webp'; }}
                                            />

                                            {/* Club name */}
                                            <p className={`${style.textSize} font-semibold text-stone-800 dark:text-warmgray-100 text-center line-clamp-2 leading-tight group-hover:text-stone-600 dark:group-hover:text-white transition-colors`}>
                                                {club.name}
                                            </p>

                                            {/* Member count */}
                                            <div className="flex items-center gap-1 mt-1">
                                                <svg className="w-3 h-3 text-stone-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="text-[10px] font-medium text-stone-500 dark:text-gray-400">{club.memberCount || 0}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {/* Friends & Suggestions Panel */}
                {auth?.user && (
                    <div className="mt-10 md:mt-16">
                        <h3 className="text-lg font-bold text-stone-800 dark:text-warmgray-100 mb-4 text-center">
                            👥 Your Friends
                        </h3>
                        {friends.length > 0 && (
                            <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                                <div className="flex gap-3 justify-center flex-wrap">
                                    {friends.map((f) => {
                                        const friend = f.friend;
                                        if (!friend) return null;
                                        return (
                                            <button
                                                key={friend.id}
                                                onClick={() => navigate(`/profile/${friend.id}`)}
                                                className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-xl border border-warmgray-200 dark:border-gray-700 hover:shadow-md hover:border-stone-300 dark:hover:border-gray-600 transition-all cursor-pointer group w-24 flex-shrink-0"
                                            >
                                                <img
                                                    src={getProfileImageUrl(friend.profileImage) || '/images/default.webp'}
                                                    alt={friend.name || friend.username}
                                                    className="w-12 h-12 rounded-full object-cover ring-2 ring-warmgray-200 dark:ring-gray-600 group-hover:ring-stone-400 transition-all"
                                                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                                                />
                                                <span className="text-xs font-medium text-stone-700 dark:text-warmgray-200 text-center truncate w-full group-hover:text-stone-500 dark:group-hover:text-white transition-colors">
                                                    {friend.name || friend.username}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Suggested Users */}
                        {suggestedUsers.length > 0 && (
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold text-stone-600 dark:text-gray-400">
                                        People You Might Know
                                    </h4>
                                    <button
                                        onClick={() => navigate('/people')}
                                        className="text-xs text-stone-500 hover:text-stone-700 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
                                    >
                                        Find More →
                                    </button>
                                </div>
                                <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                                    <div className="flex gap-3 justify-center flex-wrap">
                                        {suggestedUsers.slice(0, 8).map((user) => (
                                            <div
                                                key={user.id}
                                                className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-xl border border-warmgray-200 dark:border-gray-700 hover:shadow-md hover:border-stone-300 dark:hover:border-gray-600 transition-all group w-24 flex-shrink-0"
                                            >
                                                <button
                                                    onClick={() => navigate(`/profile/${user.id}`)}
                                                    className="flex flex-col items-center gap-1 cursor-pointer"
                                                >
                                                    <img
                                                        src={getProfileImageUrl(user.profileImage) || '/images/default.webp'}
                                                        alt={user.name}
                                                        className="w-12 h-12 rounded-full object-cover ring-2 ring-warmgray-200 dark:ring-gray-600 group-hover:ring-emerald-400 transition-all"
                                                        onError={(e) => { e.target.src = '/images/default.webp'; }}
                                                    />
                                                    <span className="text-xs font-medium text-stone-700 dark:text-warmgray-200 text-center truncate w-full">
                                                        {user.name}
                                                    </span>
                                                </button>
                                                {user.friendshipStatus === 'pending' ? (
                                                    <span className="text-[10px] px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full font-medium">
                                                        Pending
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSendFriendRequest(user.id)}
                                                        className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800/60 transition-colors cursor-pointer font-medium"
                                                    >
                                                        + Add
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Empty state - no friends AND no suggestions */}
                        {friends.length === 0 && suggestedUsers.length === 0 && (
                            <div className="text-center py-6 bg-white dark:bg-gray-800 rounded-xl border border-warmgray-200 dark:border-gray-700 max-w-md mx-auto">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">You haven't added any friends yet.</p>
                                <button
                                    onClick={() => navigate('/people')}
                                    className="px-4 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 transition-colors cursor-pointer font-medium"
                                >
                                    Find People
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            )}

            {/* Portal tooltip for member avatars */}
            {hoveredMember && createPortal(
                <div
                    className="fixed flex items-center gap-2 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap pointer-events-none"
                    style={{
                        zIndex: 99999,
                        left: hoveredMember.x,
                        top: hoveredMember.y - 10,
                        transform: 'translate(-50%, -100%)',
                    }}
                >
                    <img
                        src={hoveredMember.image}
                        alt={hoveredMember.name}
                        className="w-6 h-6 rounded-full object-cover"
                        onError={(e) => { e.target.src = '/images/default.webp'; }}
                    />
                    <span className="font-medium">{hoveredMember.name}</span>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45 -mt-1"></div>
                </div>,
                document.body
            )}

        </div>
    );
};

export default Home;