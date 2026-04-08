import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const DEFAULT_IMAGE = '/images/default.webp';

/**
 * Mini book carousel shown inside a BookClubCard when the club
 * has one or more "currently reading" entries.
 *
 * @param {{ books: Array, activeIndex: number, onIndexChange: (i:number)=>void }} props
 */
const CurrentlyReading = ({ books, activeIndex, onIndexChange }) => {
  const current = books[activeIndex] || books[0];
  const multi = books.length > 1;

  const prev = (e) => {
    e.stopPropagation();
    onIndexChange((activeIndex - 1 + books.length) % books.length);
  };
  const next = (e) => {
    e.stopPropagation();
    onIndexChange((activeIndex + 1) % books.length);
  };
  const goTo = (e, i) => {
    e.stopPropagation();
    onIndexChange(i);
  };

  return (
    <div className="mb-3 p-2.5 bg-stone-50 dark:bg-gray-700/50 rounded-xl">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] uppercase tracking-widest text-stone-400 dark:text-gray-500 font-bold font-outfit">
          Reading now
        </p>
        {multi && (
          <span className="text-[10px] text-stone-400 dark:text-gray-500 font-medium tabular-nums">
            {activeIndex + 1}/{books.length}
          </span>
        )}
      </div>

      <div className="flex gap-2.5 items-center">
        {multi && (
          <button onClick={prev} className="flex-shrink-0 w-5 h-5 rounded-full bg-white dark:bg-gray-600 border border-stone-200 dark:border-gray-500 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-gray-200 transition-colors">
            <FiChevronLeft size={11} />
          </button>
        )}

        <img
          src={current.book?.coverUrl || DEFAULT_IMAGE}
          alt={current.book?.title}
          className="w-9 h-[50px] object-cover rounded-md shadow-sm flex-shrink-0"
          loading="lazy"
          onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
        />

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-stone-800 dark:text-gray-200 line-clamp-2 leading-tight font-outfit">
            {current.book?.title}
          </p>
          <p className="text-[11px] text-stone-400 dark:text-gray-500 truncate mt-0.5 font-outfit">
            {current.book?.author}
          </p>
        </div>

        {multi && (
          <button onClick={next} className="flex-shrink-0 w-5 h-5 rounded-full bg-white dark:bg-gray-600 border border-stone-200 dark:border-gray-500 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-gray-200 transition-colors">
            <FiChevronRight size={11} />
          </button>
        )}
      </div>

      {multi && (
        <div className="flex justify-center gap-1 mt-2">
          {books.map((_, i) => (
            <button
              key={i}
              onClick={(e) => goTo(e, i)}
              className={`rounded-full transition-all ${
                i === activeIndex
                  ? 'w-3 h-1.5 bg-stone-500'
                  : 'w-1.5 h-1.5 bg-stone-300 dark:bg-gray-600 hover:bg-stone-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CurrentlyReading;
