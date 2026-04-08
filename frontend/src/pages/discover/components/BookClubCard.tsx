import { FiLock, FiUnlock, FiEyeOff } from 'react-icons/fi';
import { getCollabImageUrl } from '@config/constants';
import CurrentlyReading from './CurrentlyReading';
import MemberAvatars from './MemberAvatars';

const DEFAULT_IMAGE = '/images/default.webp';

// ─── Visibility helpers ──────────────────────────────────

const VISIBILITY_ICONS = {
  PUBLIC:      <FiUnlock className="w-4 h-4" />,
  PRIVATE:     <FiLock className="w-4 h-4" />,
  INVITE_ONLY: <FiEyeOff className="w-4 h-4" />,
};

const VISIBILITY_COLORS = {
  PUBLIC:      'bg-green-100 text-green-700',
  PRIVATE:     'bg-yellow-100 text-yellow-700',
  INVITE_ONLY: 'bg-stone-100 text-stone-800',
};

// ─── Component ───────────────────────────────────────────

/**
 * A single discover-grid card.
 *
 * @param {{
 *   bookClub: object,
 *   bookIndex: number,
 *   onBookIndexChange: (id: string, idx: number) => void,
 *   friendIds: Set<string>,
 *   onClick: (e: Event) => void,
 *   onHoverMember: (m | null) => void,
 * }} props
 */
const BookClubCard = ({ bookClub, bookIndex = 0, onBookIndexChange, friendIds, onClick, onHoverMember }) => {
  const visIcon  = VISIBILITY_ICONS[bookClub.visibility]  ?? VISIBILITY_ICONS.PUBLIC;
  const visColor = VISIBILITY_COLORS[bookClub.visibility] ?? 'bg-gray-100 text-gray-700';

  return (
    <article
      onClick={onClick}
      className="group bg-white dark:bg-gray-800 rounded-2xl ring-1 ring-black/5 dark:ring-white/5 overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col h-[420px]"
    >
      {/* Cover image */}
      <div className="relative h-44 overflow-hidden bg-stone-200 dark:bg-gray-700">
        <img
          src={bookClub.imageUrl ? getCollabImageUrl(bookClub.imageUrl) : DEFAULT_IMAGE}
          alt={bookClub.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {bookClub.category && (
            <span className="bg-white/90 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-stone-700 font-outfit shadow-sm">
              {bookClub.category}
            </span>
          )}
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold backdrop-blur-sm shadow-sm ${visColor}`}>
            {visIcon}
            {bookClub.visibility}
          </span>
        </div>

        {bookClub.isMember && (
          <div className="absolute bottom-3 left-3 bg-green-500/90 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-[11px] font-semibold shadow-sm">
            ✓ Member
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-base font-bold text-stone-900 dark:text-gray-100 mb-1 line-clamp-2 font-display leading-snug">
          {bookClub.name}
        </h3>

        {bookClub.description && (
          <p className="text-[13px] text-stone-500 dark:text-gray-400 mb-3 line-clamp-2 font-outfit leading-relaxed">
            {bookClub.description}
          </p>
        )}

        {bookClub.currentBooks?.length > 0 && (
          <CurrentlyReading
            books={bookClub.currentBooks}
            activeIndex={bookIndex}
            onIndexChange={(i) => onBookIndexChange(bookClub.id, i)}
          />
        )}

        {/* Members footer */}
        <div className="mt-auto pt-2 border-t border-stone-100 dark:border-gray-700">
          <MemberAvatars
            members={bookClub.members}
            memberCount={bookClub.memberCount}
            friendIds={friendIds}
            onHoverMember={onHoverMember}
          />
        </div>
      </div>
    </article>
  );
};

export default BookClubCard;
