import { useNavigate } from 'react-router-dom';
import { getCollabImageUrl } from '@config/constants';

const DEFAULT_IMAGE = '/images/default.webp';

const RANK_STYLES = {
  0: { size: 'w-36 h-44', ring: 'ring-4 ring-yellow-400', badge: 'bg-yellow-500', emoji: '👑', textSize: 'text-sm' },
  1: { size: 'w-28 h-36', ring: 'ring-2 ring-gray-300', badge: 'bg-gray-400', emoji: '🥈', textSize: 'text-xs' },
  2: { size: 'w-28 h-36', ring: 'ring-2 ring-amber-600', badge: 'bg-amber-600', emoji: '🥉', textSize: 'text-xs' },
  3: { size: 'w-24 h-32', ring: 'ring-1 ring-stone-300', badge: 'bg-stone-400', emoji: '', textSize: 'text-xs' },
  4: { size: 'w-24 h-32', ring: 'ring-1 ring-stone-300', badge: 'bg-stone-400', emoji: '', textSize: 'text-xs' },
};

/** Individual ranked club card in the "tournament bracket" display. */
const RankedClubCard = ({ club, rank }) => {
  const navigate = useNavigate();
  const style = RANK_STYLES[rank];
  const isFirst = rank === 0;

  return (
    <button
      onClick={() => navigate(`/bookclubpage/${club.id}`)}
      className={`${style.size} flex flex-col items-center justify-end p-2 bg-white dark:bg-gray-800 rounded-xl border border-warmgray-200 dark:border-gray-700 hover:shadow-lg hover:border-stone-400 dark:hover:border-gray-500 transition-all cursor-pointer group relative ${isFirst ? 'mb-2' : ''}`}
    >
      {/* Rank badge */}
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${style.badge} text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md`}>
        {style.emoji || rank + 1}
      </div>

      {/* Club image */}
      <img
        src={club.imageUrl ? getCollabImageUrl(club.imageUrl) : DEFAULT_IMAGE}
        alt={club.name}
        className={`${isFirst ? 'w-14 h-14' : 'w-10 h-10'} rounded-full object-cover ${style.ring} shadow-md mb-2`}
        loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
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
        <span className="text-[10px] font-medium text-stone-500 dark:text-gray-400">
          {club.memberCount || 0}
        </span>
      </div>
    </button>
  );
};

/**
 * "Most Popular Book Clubs" – tournament-bracket-style display
 * of the 5 most popular clubs (1st in center, flanked by 2nd & 3rd, etc).
 */
const PopularClubsSection = ({ bookClubs = [] }) => {
  const popularClubs = [...bookClubs]
    .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
    .slice(0, 5);

  if (popularClubs.length === 0) return null;

  // Arrange in bracket order: 4th, 2nd, 1st, 3rd, 5th
  const bracketOrder = [
    popularClubs[3],
    popularClubs[1],
    popularClubs[0],
    popularClubs[2],
    popularClubs[4],
  ].filter(Boolean);

  return (
    <div className="mt-10 md:mt-16">
      <h3 className="text-lg font-bold text-stone-800 dark:text-warmgray-100 mb-6 text-center">
        🔥 Most Popular Book Clubs
      </h3>
      <div className="flex items-end justify-center gap-2 sm:gap-4 flex-wrap">
        {bracketOrder.map((club) => {
          const rank = popularClubs.indexOf(club);
          return <RankedClubCard key={club.id} club={club} rank={rank} />;
        })}
      </div>
    </div>
  );
};

export default PopularClubsSection;
