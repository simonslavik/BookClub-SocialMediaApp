import { useState, useMemo } from 'react';
import { FiBook, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const DEFAULT_IMG = '/images/default.webp';
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function calcProgress(book) {
    if (!book?.startDate || !book?.endDate) return 0;
    const start = new Date(book.startDate);
    const end = new Date(book.endDate);
    return Math.round(Math.min(100, Math.max(0, ((new Date() - start) / (end - start)) * 100)));
}

function calcDaysLeft(book) {
    if (!book?.endDate) return 0;
    return Math.max(0, Math.ceil((new Date(book.endDate) - new Date()) / 86400000));
}

export default function CurrentBookCard({ books = [] }) {
    const [idx, setIdx] = useState(0);
    const book = books[idx];
    const count = books.length;

    const progress = useMemo(() => calcProgress(book), [book]);
    const daysLeft = useMemo(() => calcDaysLeft(book), [book]);

    if (!count) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl ring-1 ring-black/5 dark:ring-white/5 p-10 text-center">
                <FiBook className="mx-auto text-3xl text-stone-300 dark:text-gray-600 mb-3" />
                <p className="text-sm font-medium text-stone-600 dark:text-gray-300 font-display">No book selected yet</p>
                <p className="text-xs text-stone-400 dark:text-gray-500 font-outfit mt-1">This club hasn't started reading.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl ring-1 ring-black/5 dark:ring-white/5 p-6">
            {/* Header with carousel nav */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] uppercase tracking-widest text-stone-400 dark:text-gray-500 font-bold font-outfit">
                    Currently Reading{count > 1 && ` · ${idx + 1}/${count}`}
                </p>
                {count > 1 && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIdx(i => (i - 1 + count) % count)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Previous book"
                        >
                            <FiChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setIdx(i => (i + 1) % count)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Next book"
                        >
                            <FiChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            <div className="flex gap-5">
                <img
                    src={book.book?.coverUrl || DEFAULT_IMG}
                    alt={book.book?.title}
                    className="w-24 h-36 md:w-28 md:h-[168px] object-cover rounded-lg shadow-sm flex-shrink-0"
                    onError={(e) => { e.target.src = DEFAULT_IMG; }}
                />
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-stone-900 dark:text-gray-100 font-display leading-snug line-clamp-2">
                        {book.book?.title}
                    </h3>
                    <p className="text-sm text-stone-500 dark:text-gray-400 font-outfit mt-0.5">
                        {book.book?.author}
                    </p>

                    {/* Progress */}
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-stone-500 dark:text-gray-400 font-outfit mb-1.5">
                            <span>{fmtDate(book.startDate)} → {fmtDate(book.endDate)}</span>
                            <span className="font-semibold text-stone-700 dark:text-stone-300">{progress}%</span>
                        </div>
                        <div className="w-full bg-stone-100 dark:bg-gray-700 rounded-full h-1.5">
                            <div className="bg-stone-700 dark:bg-stone-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                    </div>

                    {/* Compact stats */}
                    <div className="flex gap-6 mt-4 text-sm font-outfit">
                        <div>
                            <span className="font-bold text-stone-800 dark:text-gray-200">{book.book?.pageCount || '—'}</span>
                            <span className="text-stone-400 dark:text-gray-500 ml-1">pages</span>
                        </div>
                        <div>
                            <span className="font-bold text-stone-800 dark:text-gray-200">{daysLeft}</span>
                            <span className="text-stone-400 dark:text-gray-500 ml-1">days left</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dot indicators */}
            {count > 1 && (
                <div className="flex justify-center gap-1.5 mt-4">
                    {books.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setIdx(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-stone-700 dark:bg-stone-300' : 'bg-stone-200 dark:bg-gray-600'}`}
                            aria-label={`Go to book ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
