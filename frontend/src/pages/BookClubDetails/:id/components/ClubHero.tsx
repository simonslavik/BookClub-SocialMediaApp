import { FiUsers, FiBook, FiArrowRight, FiClock } from 'react-icons/fi';
import { getCollabImageUrl } from '@config/constants';

const DEFAULT_IMG = '/images/default.webp';

export default function ClubHero({ bookClub, members, totalBooks, currentBooks, actionLabel, onAction }) {
    const nearestEnd = currentBooks.length
        ? currentBooks.reduce((nearest, b) => {
            const d = b.endDate ? Math.max(0, Math.ceil((new Date(b.endDate) - new Date()) / 86400000)) : Infinity;
            return d < nearest ? d : nearest;
        }, Infinity)
        : null;
    return (
        <section className="bg-stone-800 dark:bg-gray-950">
            <div className="max-w-5xl mx-auto px-5 md:px-8 py-10 md:py-16 flex flex-col md:flex-row items-center gap-6 md:gap-10">
                {/* Club image */}
                {bookClub?.imageUrl ? (
                    <img
                        src={getCollabImageUrl(bookClub.imageUrl)}
                        alt={bookClub.name}
                        className="w-28 h-28 md:w-36 md:h-36 rounded-2xl object-cover ring-4 ring-white/10 flex-shrink-0"
                        onError={(e) => { e.target.src = DEFAULT_IMG; }}
                    />
                ) : (
                    <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                        <FiBook className="text-white/40 text-5xl" />
                    </div>
                )}

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl md:text-5xl font-display font-bold text-white leading-tight tracking-tight">
                        {bookClub?.name}
                    </h1>
                    {bookClub?.description && (
                        <p className="mt-2 text-stone-300 font-outfit text-sm md:text-base max-w-xl leading-relaxed line-clamp-2">
                            {bookClub.description}
                        </p>
                    )}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4 text-stone-400 text-sm font-outfit">
                        <span className="flex items-center gap-1.5"><FiUsers size={15} /> {members.length} members</span>
                        <span className="flex items-center gap-1.5"><FiBook size={15} /> {totalBooks} books</span>
                        {nearestEnd !== null && nearestEnd !== Infinity && <span className="flex items-center gap-1.5"><FiClock size={15} /> {nearestEnd}d left</span>}
                    </div>
                </div>

                {/* CTA */}
                <button
                    onClick={onAction}
                    className="w-full md:w-auto px-7 py-3 bg-white text-stone-800 rounded-xl text-sm font-semibold hover:bg-stone-100 transition-colors flex items-center justify-center gap-2 flex-shrink-0"
                >
                    {actionLabel}
                    <FiArrowRight size={16} />
                </button>
            </div>
        </section>
    );
}
