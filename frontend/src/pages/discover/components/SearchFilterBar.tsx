import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { BOOKCLUB_CATEGORIES } from '@config/constants';

/**
 * Search bar + multi-select category pill filters.
 *
 * @param {{ searchQuery: string, onSearchChange: (v:string)=>void, selectedCategories: string[], onToggleCategory: (c:string)=>void }} props
 */
const SearchFilterBar = ({ searchQuery, onSearchChange, selectedCategories, onToggleCategory }) => (
  <div className="max-w-7xl mx-auto px-5 md:px-8 -mt-7">
    <div className="rounded-2xl">
      {/* Search input */}
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-lg" />
        <input
          type="text"
          placeholder="Search for book clubs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-stone-200 dark:border-gray-600 bg-stone-50 dark:bg-gray-700 text-stone-900 dark:text-gray-100 placeholder-stone-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-stone-400/40 focus:border-stone-400 transition font-outfit text-base"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <FiX className="text-lg" />
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="mt-5">
        <div className="flex items-center gap-2 mb-3">
          <FiFilter className="text-stone-500 dark:text-gray-400" size={14} />
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-gray-400 font-outfit">
            Categories
          </span>
          {selectedCategories.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-stone-800 dark:bg-warmgray-200 text-white dark:text-stone-900 text-[10px] font-bold font-outfit">
              {selectedCategories.length}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {BOOKCLUB_CATEGORIES.map((cat) => {
            const isActive = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => onToggleCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 font-outfit ${
                  isActive
                    ? 'bg-stone-800 dark:bg-warmgray-200 text-white dark:text-stone-900 shadow-md'
                    : 'bg-stone-100 dark:bg-gray-700 text-stone-600 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

export default SearchFilterBar;
