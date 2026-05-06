import { FiCheckCircle } from 'react-icons/fi';

const DEFAULT_IMG = '/images/default.webp';

export default function CompletedBooks({ books }) {
    if (!books.length) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl ring-1 ring-black/5 dark:ring-white/5 p-6">
            <p className="text-[11px] uppercase tracking-widest text-stone-400 dark:text-gray-500 font-bold font-outfit mb-4 flex items-center gap-2">
                <FiCheckCircle size={13} /> Completed
            </p>
            <div className="flex gap-4 overflow-x-auto pb-1">
                {books.map((entry) => (
                    <div key={entry.id} className="flex-shrink-0 w-24 text-center">
                        <img
                            src={entry.book?.coverUrl || DEFAULT_IMG}
                            alt={entry.book?.title}
                            className="w-24 h-36 object-cover rounded-lg shadow-sm"
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMG; }}
                        />
                        <p className="text-xs font-medium text-stone-700 dark:text-gray-200 line-clamp-2 mt-2 font-outfit">{entry.book?.title}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
