import { useState, useContext } from 'react';
import { FiSearch, FiX, FiBook } from 'react-icons/fi';
import { AuthContext } from '../../context';

const GATEWAY_URL = 'http://localhost:3000';

const AddBookToLibraryModal = ({ onClose, onBookAdded }) => {
  const { auth } = useContext(AuthContext);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addingBookId, setAddingBookId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [addedBooks, setAddedBooks] = useState({}); // Track added books: { bookId: status }

  const searchBooks = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch(`${GATEWAY_URL}/v1/books/search?q=${encodeURIComponent(query)}&limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.data || []);
      } else {
        setError('Failed to search books');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToLibrary = async (googleBooksId, status) => {
    if (!auth?.token) {
      setError('Please login to add books to your library');
      return;
    }

    setAddingBookId(googleBooksId);
    setError(null);

    try {
      const response = await fetch(`${GATEWAY_URL}/v1/user-books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ googleBooksId, status })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Mark this book as added with its status
        setAddedBooks(prev => ({ ...prev, [googleBooksId]: status }));
        setSuccessMessage(`✓ Book added to ${status.replace('_', ' ')}!`);
        setTimeout(() => setSuccessMessage(''), 2000);
      } else {
        setError(data.error || 'Failed to add book');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Add book error:', err);
    } finally {
      setAddingBookId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiBook />
            Add Books to Your Library
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Search Form */}
          <form onSubmit={searchBooks} className="mb-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for books by title, author, or ISBN..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Searching...
                  </div>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </form>

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

          {/* Empty State - Before Search */}
          {!hasSearched && results.length === 0 && (
            <div className="text-center py-16">
              <FiSearch className="mx-auto text-6xl text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Search for Books</h3>
              <p className="text-gray-500">Enter a title, author, or ISBN to find books</p>
            </div>
          )}

          {/* No Results - After Search */}
          {hasSearched && !loading && results.length === 0 && query.trim() && (
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
              <p className="text-gray-500">Try searching with different keywords</p>
            </div>
          )}

          {/* Results Grid */}
          {results.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Found {results.length} book{results.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {results.map((book) => (
                  <div
                    key={book.googleBooksId}
                    className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-200"
                  >
                    {/* Book Cover */}
                    <div className="relative h-48 bg-gray-200 flex items-center justify-center">
                      {book.coverUrl ? (
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="hidden flex-col items-center justify-center p-4 text-gray-400">
                        <FiBook className="text-4xl mb-2" />
                        <span className="text-xs">No cover</span>
                      </div>
                    </div>

                    {/* Book Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 text-sm min-h-[2.5rem]">
                        {book.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2 truncate">{book.author}</p>
                      
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
                          className="w-full px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {addingBookId === book.googleBooksId ? 'Adding...' : '📚 Want to Read'}
                        </button>
                        
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            onClick={() => addToLibrary(book.googleBooksId, 'reading')}
                            disabled={addingBookId === book.googleBooksId}
                            className="px-2 py-1.5 text-xs font-semibold bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                          >
                            📖 Reading
                          </button>
                          <button
                            onClick={() => addToLibrary(book.googleBooksId, 'completed')}
                            disabled={addingBookId === book.googleBooksId}
                            className="px-2 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                          >
                            ✅ Read
                          </button>
                          <button
                            onClick={() => addToLibrary(book.googleBooksId, 'favorite')}
                            disabled={addingBookId === book.googleBooksId}
                            className="px-2 py-1.5 text-xs font-semibold bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                          >
                            ❤️ Fav
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddBookToLibraryModal;
