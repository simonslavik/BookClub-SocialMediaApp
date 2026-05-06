import { FiBook } from 'react-icons/fi';
import { getProfileImageUrl, getCollabImageUrl } from '@config/constants';

const DEFAULT_IMG = '/images/default.webp';

export default function BookClubsGrid({ clubs, isOwnProfile, profileId, navigate, profileName }: any) {
    const count = clubs.length;

    return (
        <section>
            {/* Section header */}
            <div className="flex items-center gap-3 mb-5">
                <p className="text-[11px] uppercase tracking-widest text-stone-500 font-outfit font-semibold">
                    Book Clubs
                </p>
                <span className="text-[11px] font-bold bg-stone-200/60 dark:bg-gray-700 text-stone-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                    {count}
                </span>
            </div>

            {count === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl ring-1 ring-black/5 dark:ring-white/5 p-10 md:p-14 text-center">
                    <div className="w-14 h-14 bg-stone-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FiBook className="text-stone-400" size={24} />
                    </div>
                    <p className="text-stone-500 dark:text-gray-400 text-sm font-outfit mb-4">
                        {isOwnProfile ? "You haven't joined any book clubs yet" : 'No book clubs yet'}
                    </p>
                    {isOwnProfile && (
                        <button
                            onClick={() => navigate('/create-bookclub')}
                            className="px-5 py-2.5 bg-stone-800 text-white rounded-xl hover:bg-stone-700 transition-colors text-sm font-semibold font-outfit"
                        >
                            Create Your First Club
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {clubs.map(club => (
                        <ClubCard key={club.id} club={club} profileId={profileId} navigate={navigate} />
                    ))}
                </div>
            )}
        </section>
    );
}

/* ── Individual club card ─────────────────────────── */
function ClubCard({ club, profileId, navigate }) {
    const isCreator = club.creatorId === profileId;

    return (
        <div
            onClick={() => navigate(`/bookclub/${club.id}`)}
            className="group bg-white dark:bg-gray-800 rounded-2xl ring-1 ring-black/5 dark:ring-white/5 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
        >
            {/* Image */}
            <div className="relative h-40 overflow-hidden">
                <img
                    src={club.imageUrl ? getCollabImageUrl(club.imageUrl) : DEFAULT_IMG}
                    alt={club.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMG; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                    {isCreator && (
                        <span className="bg-white/90 backdrop-blur-sm text-stone-700 text-[11px] px-2 py-0.5 rounded-full font-semibold shadow-sm">
                            ✦ Owner
                        </span>
                    )}
                </div>

                {(club.activeUsers || 0) > 0 && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-white text-[11px] font-medium">{club.activeUsers} online</span>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="p-4">
                <h3 className="font-semibold text-stone-800 dark:text-gray-100 truncate font-display">{club.name}</h3>

                {/* Current book */}
                {club.currentBook && (
                    <div className="mt-2.5 p-2.5 bg-[#F0EFEB] dark:bg-gray-700/50 rounded-lg">
                        <p className="text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-1.5 font-outfit">Currently Reading</p>
                        <div className="flex gap-2">
                            <img
                                src={club.currentBook.book?.coverUrl || DEFAULT_IMG}
                                alt={club.currentBook.book?.title}
                                className="w-9 h-12 object-cover rounded shadow-sm"
                                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMG; }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-tight">{club.currentBook.book?.title}</p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{club.currentBook.book?.author}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Members */}
                {club.members?.length > 0 && (
                    <div className="mt-3 flex items-center justify-between">
                        <div className="flex -space-x-2">
                            {club.members.slice(0, 4).map((m, i) => (
                                <img
                                    key={i}
                                    src={getProfileImageUrl(m.profileImage) || DEFAULT_IMG}
                                    alt=""
                                    className="w-6 h-6 rounded-full border-2 border-white object-cover"
                                    loading="lazy"
                                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMG; }}
                                />
                            ))}
                            {club.members.length > 4 && (
                                <div className="w-6 h-6 rounded-full border-2 border-white bg-stone-100 flex items-center justify-center text-[9px] font-bold text-stone-700">
                                    +{club.members.length - 4}
                                </div>
                            )}
                        </div>
                        <span className="text-xs text-stone-400 font-outfit">
                            {club.memberCount || club.members?.length || 0} members
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
