import { useNavigate } from 'react-router-dom';
import { getCollabImageUrl } from '@config/constants';
import useScrollReveal from '@hooks/useScrollReveal';

const DEFAULT_IMAGE = '/images/default.webp';

/** Skeleton placeholder shown while clubs are loading. */
const ClubCardSkeleton = () => (
  <div className="flex flex-col bg-parchment-light dark:bg-gray-800 p-5 pb-8 shadow-md">
    <div className="w-full aspect-[4/5] bg-warmgray-200 dark:bg-gray-700" />
    <div className="mt-6 flex flex-col items-center gap-2">
      <div className="h-4 w-28 bg-warmgray-200 dark:bg-gray-700 rounded" />
      <div className="h-3 w-20 bg-warmgray-200 dark:bg-gray-700 rounded" />
    </div>
  </div>
);

/** Individual top-charting book club card. */
const TopClubCard = ({ club }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/bookclubpage/${club.id}`)}
      className="flex flex-col bg-parchment-light dark:bg-gray-800 p-5 pb-8 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer"
    >
      {/* Image area */}
      <div className="w-full aspect-[4/5] overflow-hidden bg-warmgray-300 dark:bg-gray-700">
        <img
          src={club.imageUrl ? getCollabImageUrl(club.imageUrl) : DEFAULT_IMAGE}
          alt={club.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
        />
      </div>

      {/* Caption */}
      <div className="mt-5 flex flex-col items-center gap-1">
        <p className="text-sm font-semibold text-stone-800 dark:text-warmgray-200 line-clamp-1 group-hover:text-stone-600 dark:group-hover:text-white transition-colors">
          {club.name}
        </p>
        <p className="text-xs text-stone-400 dark:text-gray-500 font-serif italic">
          {club.memberCount || 0} members
        </p>
      </div>
    </button>
  );
};

/**
 * "Top Charting" section – shows the 3 most popular book clubs
 * or skeleton placeholders while loading.
 */
const TopChartingSection = ({ bookClubs = [] }) => {
  const topClubs = [...bookClubs]
    .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
    .slice(0, 3);

  const { ref, isVisible } = useScrollReveal(0.15);

  return (
    <section ref={ref} className="px-6 md:px-16 py-16 md:py-24">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className={`font-display text-4xl md:text-5xl font-bold text-stone-900 dark:text-warmgray-100 mb-11 leading-tight transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          Top Charting
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {topClubs.length === 0
            ? Array.from({ length: 3 }, (_, i) => <ClubCardSkeleton key={i} />)
            : topClubs.map((club, i) => (
                <div
                  key={club.id}
                  className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                  style={{ transitionDelay: isVisible ? `${200 + i * 150}ms` : '0ms' }}
                >
                  <TopClubCard club={club} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
};

export default TopChartingSection;
