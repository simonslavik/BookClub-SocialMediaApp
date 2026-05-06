import { useState, useMemo } from 'react';
import { FiPlus, FiBook, FiInfo } from 'react-icons/fi';

const SHELF_META = {
    favorite:     { label: '♥ Favorite',    badge: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    reading:      { label: 'Reading',       badge: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    want_to_read: { label: 'Want to Read',  badge: 'bg-stone-100 text-stone-700 dark:bg-gray-700 dark:text-gray-300' },
    completed:    { label: 'Finished',      badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
};

const TABS = [
    { key: 'all',          label: 'All' },
    { key: 'reading',      label: 'Reading' },
    { key: 'want_to_read', label: 'Want to Read' },
    { key: 'completed',    label: 'Read' },
    { key: 'favorite',     label: 'Favorites' },
];

export default function BookLibrary({
    favoriteBooks, booksReading, booksToRead, booksRead,
    isOwnProfile, profileName,
    onAddBook, onDeleteBook, onViewBook,
}) {
    const [filter, setFilter] = useState('all');

    const counts = useMemo(() => ({
        all: favoriteBooks.length + booksReading.length + booksToRead.length + booksRead.length,
        reading: booksReading.length,
        want_to_read: booksToRead.length,
        completed: booksRead.length,
        favorite: favoriteBooks.length,
    }), [favoriteBooks, booksReading, booksToRead, booksRead]);

    const filteredBooks = useMemo(() => {
        const tag = (arr, shelf) => arr.map(b => ({ ...b, _shelf: shelf }));
        if (filter === 'all') return [...tag(booksReading, 'reading'), ...tag(booksToRead, 'want_to_read'), ...tag(booksRead, 'completed'), ...tag(favoriteBooks, 'favorite')];
        if (filter === 'reading') return tag(booksReading, 'reading');
        if (filter === 'want_to_read') return tag(booksToRead, 'want_to_read');
        if (filter === 'completed') return tag(booksRead, 'completed');
        return tag(favoriteBooks, 'favorite');
    }, [filter, favoriteBooks, booksReading, booksToRead, booksRead]);

    const hasBooks = counts.all > 0;
    if (!hasBooks && !isOwnProfile) return null;

    return (
        <section>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
                <p className="text-[11px] uppercase tracking-widest text-stone-500 font-outfit font-semibold">
                    {isOwnProfile ? 'My Library' : `${profileName}'s Library`}
                </p>
                {isOwnProfile && (
                    <button
                        onClick={onAddBook}
                        className="px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-sm font-semibold font-outfit transition-colors flex items-center gap-2"
                    >
                        <FiPlus size={16} />
                        Add Books
                    </button>
                )}
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium font-outfit transition-all ${
                            filter === tab.key
                                ? 'bg-stone-800 text-white shadow-sm'
                                : 'bg-white dark:bg-gray-800 text-stone-600 dark:text-gray-300 ring-1 ring-black/5 dark:ring-white/10 hover:bg-stone-50 dark:hover:bg-gray-700'
                        }`}
                    >
                        {tab.label}
                        <span className="ml-1.5 text-xs opacity-60">{counts[tab.key]}</span>
                    </button>
                ))}
            </div>

            {/* Grid or empty state */}
            {filteredBooks.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl ring-1 ring-black/5 dark:ring-white/5 p-12 text-center">
                    <div className="w-14 h-14 bg-stone-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FiBook className="text-stone-400" size={24} />
                    </div>
                    <p className="text-stone-500 dark:text-gray-400 text-sm font-outfit">
                        {isOwnProfile
                            ? filter === 'all'
                                ? 'No books in your library yet. Click "Add Books" to get started!'
                                : 'No books on this shelf yet.'
                            : 'No books in library yet.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {filteredBooks.map(ub => (
                        <BookCard
                            key={ub.id}
                            userBook={ub}
                            showShelf={filter === 'all'}
                            isOwnProfile={isOwnProfile}
                            onDelete={onDeleteBook}
                            onView={onViewBook}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

/* ── Book card ────────────────────────────────────── */
function BookCard({ userBook, showShelf, isOwnProfile, onDelete, onView }) {
    const meta = SHELF_META[userBook._shelf];
    return (
        <div className="group">
            <div className="relative rounded-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5 group-hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <img
                    src={userBook.book.coverUrl || '/images/default.webp'}
                    alt={userBook.book.title}
                    className="w-full h-56 object-cover"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/default.webp'; }}
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center p-3 gap-2">
                    {isOwnProfile && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(userBook.id); }}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                            Remove
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onView(userBook.book); }}
                        className="p-2 bg-white/90 hover:bg-white text-gray-800 rounded-lg transition-colors"
                    >
                        <FiInfo size={14} />
                    </button>
                </div>

                {/* Shelf badge */}
                {showShelf && meta && (
                    <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.badge}`}>
                        {meta.label}
                    </span>
                )}

                {/* Rating */}
                {userBook.rating > 0 && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-yellow-400 text-[11px] font-bold px-2 py-0.5 rounded-full">
                        {'★'.repeat(userBook.rating)}
                    </div>
                )}
            </div>
            <h4 className="mt-2.5 text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug font-display">{userBook.book.title}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-outfit">{userBook.book.author}</p>
        </div>
    );
}
