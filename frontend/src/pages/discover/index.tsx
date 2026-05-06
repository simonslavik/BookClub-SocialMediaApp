import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HomePageHeader from '@components/layout/Header';
import MemberTooltip from '@components/common/MemberTooltip';
import { AuthContext } from '@context/index';
import { bookclubAPI } from '@api/bookclub.api';
import apiClient from '@api/axios';
import logger from '@utils/logger';
import { DiscoverCardSkeleton } from '@components/common/Skeleton';
import EmptyState from '@components/common/EmptyState';
import { DiscoverHero, SearchFilterBar, BookClubCard } from './components';

// ─── Component ───────────────────────────────────────────

const DiscoverBookClubs = () => {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────
  const [bookClubs, setBookClubs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardBookIndex, setCardBookIndex] = useState({});
  const [friends, setFriends] = useState([]);
  const [hoveredMember, setHoveredMember] = useState(null);

  // ── Derived ────────────────────────────────────────────
  const friendIds = useMemo(
    () => new Set(friends.map((f) => f.friendId || f.id)),
    [friends],
  );

  const filteredBookClubs = useMemo(() => {
    if (!searchQuery.trim()) return bookClubs;
    const q = searchQuery.toLowerCase();
    return bookClubs.filter((c) => c.name.toLowerCase().includes(q));
  }, [searchQuery, bookClubs]);

  // ── Data fetching ──────────────────────────────────────
  useEffect(() => {
    if (!auth?.token) return;
    apiClient
      .get('/v1/friends/list')
      .then((res) => setFriends(res.data?.data || []))
      .catch((err) => logger.error('Error fetching friends:', err));
  }, [auth?.token]);

  useEffect(() => {
    const fetchBookclubs = async () => {
      try {
        const categories = selectedCategories.length > 0 ? selectedCategories : undefined;
        const response = await bookclubAPI.discoverBookclubs(categories);
        const clubs = response.data || [];

        // Batch-fetch currently-reading books
        const clubIds = clubs.map((c) => c.id);
        if (clubIds.length > 0) {
          try {
            const booksRes = await apiClient.post('/v1/bookclub/batch-current-books', { bookClubIds: clubIds });
            if (booksRes.data?.success && Array.isArray(booksRes.data.currentBooks)) {
              const booksMap = new Map(
                booksRes.data.currentBooks.map((b) => [b.bookClubId, b.currentBooks || []]),
              );
              setBookClubs(clubs.map((c) => ({ ...c, currentBooks: booksMap.get(c.id) || [] })));
              return;
            }
          } catch (err) {
            logger.error('Error fetching batch current books:', err);
          }
        }

        setBookClubs(clubs);
      } catch (err) {
        logger.error('Error fetching book clubs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookclubs();
  }, [selectedCategories]);

  // ── Handlers ───────────────────────────────────────────
  const handleBookclubClick = useCallback(
    (bookClub, e) => {
      e.stopPropagation();
      navigate(`/bookclubpage/${bookClub.id}`);
    },
    [navigate],
  );

  const handleBookIndexChange = useCallback((clubId, idx) => {
    setCardBookIndex((prev) => ({ ...prev, [clubId]: idx }));
  }, []);

  // ── Render helpers ─────────────────────────────────────
  const hasFilters = searchQuery || selectedCategories.length > 0;

  const toggleCategory = useCallback((cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategories([]);
  }, []);

  // ── JSX ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0EFEB] dark:bg-gray-900 transition-colors duration-300">
      <HomePageHeader />
      <DiscoverHero />

      <div className="pb-16">
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategories={selectedCategories}
          onToggleCategory={toggleCategory}
        />

        {/* Results */}
        <div className="max-w-7xl mx-auto px-5 md:px-8 mt-8 md:mt-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-5">
            <h2 className="text-lg md:text-xl font-bold text-stone-800 dark:text-gray-100 font-display">
              {loading ? 'Loading...' : `${filteredBookClubs.length} Club${filteredBookClubs.length !== 1 ? 's' : ''} Found`}
            </h2>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 font-outfit font-medium underline underline-offset-2 decoration-stone-300 dark:decoration-stone-600 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <DiscoverCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredBookClubs.length === 0 ? (
            <EmptyState
              preset={hasFilters ? 'no-results' : 'no-clubs'}
              description={hasFilters ? 'Try adjusting your search or filters' : 'Be the first to create a book club!'}
              actionLabel="Create a Book Club"
              onAction={() => {
                if (auth?.token) navigate('/create-bookclub');
                else window.dispatchEvent(new Event('open-login'));
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredBookClubs.map((club) => (
                <BookClubCard
                  key={club.id}
                  bookClub={club}
                  bookIndex={cardBookIndex[club.id] || 0}
                  onBookIndexChange={handleBookIndexChange}
                  friendIds={friendIds}
                  onClick={(e) => handleBookclubClick(club, e)}
                  onHoverMember={setHoveredMember}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <MemberTooltip member={hoveredMember} />
    </div>
  );
};

export default DiscoverBookClubs;
