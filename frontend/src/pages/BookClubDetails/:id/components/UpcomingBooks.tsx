import { FiCalendar } from 'react-icons/fi';

const DEFAULT_IMG = '/images/default.webp';
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function UpcomingBooks({ books }) {
    if (!books.length) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl ring-1 ring-black/5 dark:ring-white/5 p-6">
            <p className="text-[11px] uppercase tracking-widest text-stone-400 dark:text-gray-500 font-bold font-outfit mb-4 flex items-center gap-2">
                <FiCalendar size={13} /> Up Next
            </p>
            <div className="space-y-3">
                {books.slice(0, 4).map((entry) => (
                    <div key={entry.id} className="flex gap-3 items-center">
                        <img
                            src={entry.book?.coverUrl || DEFAULT_IMG}
                            alt={entry.book?.title}
                            className="w-10 h-14 object-cover rounded-md shadow-sm flex-shrink-0"
                            onError={(e) => { e.target.src = DEFAULT_IMG; }}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-stone-800 dark:text-gray-100 line-clamp-1 font-outfit">{entry.book?.title}</p>
                            <p className="text-xs text-stone-400 dark:text-gray-500 font-outfit">{entry.book?.author}</p>
                        </div>
                        {entry.startDate && (
                            <span className="text-[11px] text-stone-400 dark:text-gray-500 font-outfit flex-shrink-0">{fmtDate(entry.startDate)}</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
