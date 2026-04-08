import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getCollabImageUrl, getProfileImageUrl } from '@config/constants';
import AuthContext from '@context/index';

const DEFAULT_IMAGE = '/images/default.webp';

// ─── Sub-components ──────────────────────────────────────────

/** "Create Book Club" card (dashed border). */
const CreateClubCard = ({ onClick, scale, opacity, zIndex, isCenter }) => (
  <div
    onClick={onClick}
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
    <span className="text-sm text-gray-600 group-hover:text-stone-800 font-semibold transition-colors">
      Create Book Club
    </span>
  </div>
);

/** Mini book-carousel inside a club card. */
const CurrentBooksPreview = ({ books, clubId, bookIdx, onChangeIndex }) => {
  const currentEntry = books[bookIdx] || books[0];
  const hasMultiple = books.length > 1;

  return (
    <div className="mt-3 p-2.5 bg-warmgray-50 rounded-lg border border-warmgray-200">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] uppercase tracking-wider text-stone-600 font-bold">Currently Reading</p>
        {hasMultiple && (
          <span className="text-[10px] text-stone-400 font-medium">
            {bookIdx + 1}/{books.length}
          </span>
        )}
      </div>

      <div className="flex gap-2 items-center">
        {hasMultiple && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChangeIndex(clubId, (bookIdx - 1 + books.length) % books.length);
            }}
            className="flex-shrink-0 w-5 h-5 rounded-full bg-white border border-warmgray-200 flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
          >
            <FiChevronLeft size={12} />
          </button>
        )}

        <img
          src={currentEntry.book?.coverUrl || DEFAULT_IMAGE}
          alt={currentEntry.book?.title}
          className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0"
          onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
        />

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">
            {currentEntry.book?.title}
          </p>
          <p className="text-[11px] text-gray-500 truncate mt-0.5">
            {currentEntry.book?.author}
          </p>
        </div>

        {hasMultiple && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChangeIndex(clubId, (bookIdx + 1) % books.length);
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
                onChangeIndex(clubId, bi);
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
};

/** Member avatar stack shown at the bottom of a club card. */
const MemberAvatars = ({ members, onHover, onLeave }) => {
  const navigate = useNavigate();

  return (
    <div className="mt-auto pt-3 flex items-center justify-between">
      <div className="flex -space-x-2">
        {members.slice(0, 4).map((member) => (
          <div key={member.id} className="relative">
            <img
              src={getProfileImageUrl(member.profileImage) || DEFAULT_IMAGE}
              alt={member.username}
              className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm cursor-pointer hover:ring-2 hover:ring-stone-400 transition-all hover:z-10 relative"
              onClick={(e) => { e.stopPropagation(); navigate(`/profile/${member.id}`); }}
              onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
              onMouseEnter={(e) => onHover(e, member)}
              onMouseLeave={onLeave}
            />
          </div>
        ))}
        {members.length > 4 && (
          <div className="w-7 h-7 rounded-full border-2 border-white bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-700">
            +{members.length - 4}
          </div>
        )}
      </div>
      <span className="text-xs text-gray-400 font-medium">
        {members.length} {members.length === 1 ? 'member' : 'members'}
      </span>
    </div>
  );
};

/** Single "book club" card inside the carousel. */
const ClubCard = ({ bookClub, scale, opacity, zIndex, isCenter, cardBookIndex, onChangeBookIndex, onMemberHover, onMemberLeave }) => {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div
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
      {/* Cover image */}
      <div className="relative h-36 sm:h-44 overflow-hidden rounded-t-2xl">
        <img
          src={bookClub.imageUrl ? getCollabImageUrl(bookClub.imageUrl) : DEFAULT_IMAGE}
          alt={bookClub.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Owner badge */}
        {bookClub.creatorId === auth?.user?.id && (
          <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-stone-800 text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm">
            ✦ Owner
          </span>
        )}

        {/* Online indicator */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-white text-xs font-medium">{bookClub.activeUsers || 0} online</span>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-bold text-gray-900 text-lg sm:text-xl leading-tight line-clamp-2">
          {bookClub.name}
        </h3>

        {bookClub.description && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
            {bookClub.description}
          </p>
        )}

        {/* Current books preview */}
        {bookClub.currentBooks?.length > 0 && (
          <CurrentBooksPreview
            books={bookClub.currentBooks}
            clubId={bookClub.id}
            bookIdx={cardBookIndex[bookClub.id] || 0}
            onChangeIndex={onChangeBookIndex}
          />
        )}

        {/* Empty state */}
        {(!bookClub.currentBooks || bookClub.currentBooks.length === 0) && !bookClub.description && (
          <div className="mt-3 flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-300 italic">No book selected yet</p>
          </div>
        )}

        {/* Members */}
        {bookClub.members?.length > 0 && (
          <MemberAvatars
            members={bookClub.members}
            onHover={onMemberHover}
            onLeave={onMemberLeave}
          />
        )}
      </div>
    </div>
  );
};

// ─── Main Carousel ───────────────────────────────────────────

/**
 * Horizontally-scrolling carousel of the user's book clubs,
 * with a "Create" card appended at the end.
 */
const MyClubsCarousel = ({
  allMyBookClubs = [],
  filterCreatedByMe,
  onToggleFilter,
  onSetHoveredMember,
}) => {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [cardBookIndex, setCardBookIndex] = useState({});

  // Responsive breakpoint — tracks sm (640px) via matchMedia instead of
  // reading window.innerWidth on every render (stale + no resize updates).
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const cardWidth = isMobile ? 240 : 300;
  const gap = isMobile ? 12 : 20;

  const displayed = useMemo(
    () =>
      filterCreatedByMe
        ? allMyBookClubs.filter((c) => c.creatorId === auth?.user?.id)
        : allMyBookClubs,
    [allMyBookClubs, filterCreatedByMe, auth?.user?.id]
  );

  const handleChangeBookIndex = useCallback((clubId, newIdx) => {
    setCardBookIndex((prev) => ({ ...prev, [clubId]: newIdx }));
  }, []);

  const handleMemberHover = useCallback(
    (e, member) => {
      const rect = e.currentTarget.getBoundingClientRect();
      onSetHoveredMember({
        id: member.id,
        name: member.name || member.username,
        image: getProfileImageUrl(member.profileImage) || DEFAULT_IMAGE,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    },
    [onSetHoveredMember]
  );

  const handleMemberLeave = useCallback(() => onSetHoveredMember(null), [onSetHoveredMember]);

  const createNewBookClub = () => navigate('/create-bookclub');

  // ── Empty state ──
  if (displayed.length === 0) {
    return (
      <div className="flex flex-col p-4 rounded w-full">
        <FilterButton active={filterCreatedByMe} onClick={onToggleFilter} />
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
            <span className="text-sm text-gray-600 group-hover:text-stone-800 font-semibold transition-colors">
              Create Book Club
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── Carousel items ──
  const items = [
    ...displayed.map((c) => ({ type: 'club', data: c })),
    { type: 'create' },
  ];
  const idx = Math.min(carouselIndex, items.length - 1);

  const goPrev = () => setCarouselIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCarouselIndex((i) => Math.min(items.length - 1, i + 1));

  const getCardTransform = (index) => {
    const offset = index - idx;
    const isCenter = offset === 0;
    const absOffset = Math.abs(offset);
    return {
      scale: isCenter ? 1 : Math.max(0.7, 1 - absOffset * 0.15),
      opacity: isCenter ? 1 : Math.max(0.35, 1 - absOffset * 0.35),
      zIndex: 10 - absOffset,
      isCenter,
    };
  };

  const stripOffset = -(idx * (cardWidth + gap));

  return (
    <div className="flex flex-col p-4 rounded w-full">
      <FilterButton active={filterCreatedByMe} onClick={onToggleFilter} />

      <div
        className="relative w-full flex items-center justify-center"
        style={{ minHeight: isMobile ? '400px' : '500px' }}
      >
        {/* Left arrow */}
        <CarouselArrow
          direction="left"
          disabled={idx === 0}
          onClick={goPrev}
        />

        {/* Track */}
        <div
          className="overflow-x-clip overflow-y-visible w-full px-4 md:px-12"
          style={{ height: isMobile ? '380px' : '470px' }}
        >
          <div
            className="flex items-center h-full transition-transform duration-500 ease-out"
            style={{
              gap: `${gap}px`,
              transform: `translateX(calc(50% - ${cardWidth / 2}px + ${stripOffset}px))`,
            }}
          >
            {items.map((item, i) => {
              const { scale, opacity, zIndex, isCenter } = getCardTransform(i);

              if (item.type === 'create') {
                return (
                  <CreateClubCard
                    key="create-card"
                    onClick={createNewBookClub}
                    scale={scale}
                    opacity={opacity}
                    zIndex={zIndex}
                    isCenter={isCenter}
                  />
                );
              }

              return (
                <ClubCard
                  key={item.data.id}
                  bookClub={item.data}
                  scale={scale}
                  opacity={opacity}
                  zIndex={zIndex}
                  isCenter={isCenter}
                  cardBookIndex={cardBookIndex}
                  onChangeBookIndex={handleChangeBookIndex}
                  onMemberHover={handleMemberHover}
                  onMemberLeave={handleMemberLeave}
                />
              );
            })}
          </div>
        </div>

        {/* Right arrow */}
        <CarouselArrow
          direction="right"
          disabled={idx === items.length - 1}
          onClick={goNext}
        />

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
    </div>
  );
};

// ─── Small helpers ───────────────────────────────────────────

const FilterButton = ({ active, onClick }) => (
  <div className="flex items-center justify-end mb-4">
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'bg-stone-600 text-white'
          : 'bg-warmgray-200 dark:bg-gray-700 text-stone-600 dark:text-warmgray-300 hover:bg-warmgray-300 dark:hover:bg-gray-600'
      }`}
    >
      {active ? '★ Mine' : '☆ Mine'}
    </button>
  </div>
);

const CarouselArrow = ({ direction, disabled, onClick }) => {
  const isLeft = direction === 'left';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`absolute ${isLeft ? 'left-2 md:left-40' : 'right-2 md:right-40'} z-20 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
        disabled
          ? 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500 cursor-not-allowed'
          : 'bg-white dark:bg-gray-700 shadow-lg text-gray-600 dark:text-gray-300 hover:bg-stone-50 dark:hover:bg-gray-600 hover:text-stone-700 hover:shadow-xl'
      }`}
    >
      {isLeft ? <FiChevronLeft size={22} /> : <FiChevronRight size={22} />}
    </button>
  );
};

export default MyClubsCarousel;
