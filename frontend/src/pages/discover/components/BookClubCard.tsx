import { getCollabImageUrl } from '@config/constants';
import CurrentlyReading from './CurrentlyReading';
import MemberAvatars from './MemberAvatars';

const DEFAULT_IMAGE = '/images/default.webp';

// ─── Pastel palette (matches home card) ──────────────────

const PASTEL_PALETTES = [
  { bg: '#E8E0D4', text: '#5C4A3A' },
  { bg: '#D4DDE8', text: '#3A4A5C' },
  { bg: '#D8E4D4', text: '#3A5C40' },
  { bg: '#E4D4DE', text: '#5C3A52' },
  { bg: '#DDD8CE', text: '#4A4438' },
  { bg: '#D4DBD8', text: '#3A4A44' },
  { bg: '#E0D9CE', text: '#54493A' },
  { bg: '#D4D4E4', text: '#3A3A5C' },
];

const getPastelForClub = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  return PASTEL_PALETTES[Math.abs(hash) % PASTEL_PALETTES.length];
};

// ─── Component ───────────────────────────────────────────

const BookClubCard = ({ bookClub, bookIndex = 0, onBookIndexChange, friendIds, onClick, onHoverMember }) => {
  const palette = getPastelForClub(bookClub.id);

  return (
    <article
      onClick={onClick}
      className="flex-shrink-0 rounded-2xl flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 relative"
      style={{
        background: palette.bg,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)',
      }}
    >
      {/* Cover image */}
      <div className="relative h-[220px] flex-shrink-0 overflow-hidden rounded-t-2xl">
        {bookClub.imageUrl ? (
          <img
            src={getCollabImageUrl(bookClub.imageUrl)}
            alt={bookClub.name}
            className="w-full h-full object-cover transition-transform duration-500"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${palette.text}22, ${palette.text}44)` }}
          >
            <span
              className="font-display font-bold tracking-tight select-none"
              style={{ fontSize: '5rem', color: palette.text, opacity: 0.55 }}
            >
              {bookClub.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Visibility badge */}
        {bookClub.visibility && (
          <span className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm text-stone-700 text-[11px] px-2 py-0.5 rounded-full font-semibold">
            {bookClub.visibility}
          </span>
        )}

        {/* Member / online indicator */}
        {bookClub.isMember ? (
          <div className="absolute bottom-3 left-3 bg-green-500/90 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-[11px] font-semibold shadow-sm">
            ✓ Member
          </div>
        ) : (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white text-[11px] font-medium">{bookClub.activeUsers || 0} online</span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 px-4 pt-3 pb-5">
        <h3 className="font-bold text-lg leading-tight line-clamp-2" style={{ color: palette.text }}>
          {bookClub.name}
        </h3>

        {bookClub.description && (
          <p className="text-xs mt-1.5 line-clamp-2 leading-relaxed opacity-60" style={{ color: palette.text }}>
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

        {(!bookClub.currentBooks || bookClub.currentBooks.length === 0) && (
          <div className="mt-3 flex-1 flex items-center justify-center">
            <p className="text-sm italic opacity-30" style={{ color: palette.text }}>No book selected yet</p>
          </div>
        )}

        {/* Members */}
        {bookClub.members?.length > 0 && (
          <div className="mt-auto pt-3">
            <MemberAvatars
              members={bookClub.members}
              memberCount={bookClub.memberCount}
              friendIds={friendIds}
              onHoverMember={onHoverMember}
            />
          </div>
        )}
      </div>
    </article>
  );
};

export default BookClubCard;
