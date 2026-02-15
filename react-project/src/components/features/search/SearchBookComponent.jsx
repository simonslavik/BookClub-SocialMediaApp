
import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '@context/index';
import apiClient from '@api/axios';
import logger from '@utils/logger';

const BookSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addingBookId, setAddingBookId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const { auth } = useContext(AuthContext);

  // Auto-search with debouncing
  useEffect(() => {
    // Clear results if query is empty
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    // Debounce: wait 500ms after user stops typing
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await apiClient.get(`/v1/books/search?q=${encodeURIComponent(query)}&limit=20`);
        
        if (data.success) {
          setResults(data.data || []);
        } else {
          setError('Failed to search books');
        }
      } catch (err) {
        setError('Network error. Please try again.');
        logger.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms delay

    // Cleanup: cancel previous timeout if user keeps typing
    return () => clearTimeout(timeoutId);
  }, [query]);

  const searchBooks = async (e) => {
    e?.preventDefault();
    // Form submit will be handled by useEffect
  };

  const addToLibrary = async (googleBooksId, status) => {
    if (!auth?.token) {
      setError('Please login to add books to your library');
      return;
    }

    setAddingBookId(googleBooksId);
    setError(null);

    try {
      const { data } = await apiClient.post('/v1/user-books', { googleBooksId, status });

      if (data.success) {
        setSuccessMessage(`Book added to ${status.replace('_', ' ')}!`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.error || 'Failed to add book');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      logger.error('Add book error:', err);
    } finally {
      setAddingBookId(null);
    }
  };



  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Search Bar */}
      <div className="mb-8">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for books by title, author, or ISBN..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          {loading && (
            <div className="flex items-center px-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
        {query && (
          <p className="mt-2 text-sm text-gray-500">
            Searching as you type...
          </p>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* No Results */}
      {!loading && results.length === 0 && query.trim() && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No books found</h3>
          <p className="mt-1 text-gray-500">Try searching with different keywords</p>
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map((book) => (
          <div
            key={book.googleBooksId}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            {/* Book Cover */}
            <div className="relative h-64 bg-gray-100 flex items-center justify-center">
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={`${book.title} cover`}
                  className="h-full w-full object-cover rounded-t-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="hidden flex-col items-center justify-center p-4 text-gray-400">
                <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-sm mt-2">No cover</span>
              </div>
            </div>

            {/* Book Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 min-h-[3rem]">
                {book.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{book.author}</p>
              
              {book.pageCount && (
                <p className="text-xs text-gray-500 mb-3">
                  {book.pageCount} pages
                </p>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => addToLibrary(book.googleBooksId, 'want_to_read')}
                  disabled={addingBookId === book.googleBooksId}
                  className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {addingBookId === book.googleBooksId ? 'Adding...' : 'Want to Read'}
                </button>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => addToLibrary(book.googleBooksId, 'reading')}
                    disabled={addingBookId === book.googleBooksId}
                    className="px-2 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    Reading
                  </button>
                  <button
                    onClick={() => addToLibrary(book.googleBooksId, 'completed')}
                    disabled={addingBookId === book.googleBooksId}
                    className="px-2 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                  >
                    Read
                  </button>
                  <button
                    onClick={() => addToLibrary(book.googleBooksId, 'favorite')}
                    disabled={addingBookId === book.googleBooksId}
                    className="px-2 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                  >
                    Favorite
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookSearch;