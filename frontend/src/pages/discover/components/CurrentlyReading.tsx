import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

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
    <div className="mt-3 px-3 py-3 rounded-xl bg-stone-800/5 dark:bg-white/5">
      <p className="text-[10px] uppercase tracking-widest text-stone-400 dark:text-stone-500 font-semibold mb-2">
        Currently Reading
      </p>

      <div className="flex items-center gap-2">
        {multi && (
          <button onClick={prev} className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
            <FiChevronLeft size={12} />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-serif italic text-stone-700 dark:text-stone-200 line-clamp-2 leading-snug">
            {current.book?.title}
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
            — {current.book?.author}
          </p>
        </div>

        {multi && (
          <button onClick={next} className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
            <FiChevronRight size={12} />
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
                  : 'w-1.5 h-1.5 bg-stone-300 dark:bg-stone-600 hover:bg-stone-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CurrentlyReading;
