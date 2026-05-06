import { useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { FiSearch, FiX, FiBook, FiCalendar, FiCheck } from 'react-icons/fi';
import AuthContext from '@context/index';
import apiClient from '@api/axios';
import logger from '@utils/logger';
import { useToast } from '@hooks/useUIFeedback';

const AddBookToBookclubModal = ({ bookClubId, onClose, onBookAdded }) => {
  const { auth } = useContext(AuthContext);
  const { toastError, toastWarning } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [status, setStatus] = useState('upcoming');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [adding, setAdding] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const { data } = await apiClient.get(
        `/v1/books/search?q=${encodeURIComponent(searchQuery)}&limit=20`
      );

      if (data.success) {
        setSearchResults(data.data || []);
      } else {
        toastError('Failed to search for books');
      }
    } catch (err) {
      logger.error('Error searching books:', err);
      toastError('Failed to search for books');
    } finally {
      setSearching(false);
    }
  };

  const handleAddBook = async () => {
    if (!selectedBook) return;

    if (!auth?.token) {
      toastWarning('Please log in to add books');
      return;
    }

    if (!selectedBook.googleBooksId) {
      toastWarning('Invalid book data - missing Google Books ID');
      return;
    }

    setAdding(true);
    try {
      logger.debug('Adding book with data:', {
        googleBooksId: selectedBook.googleBooksId,
        status: status,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });

      // Create an abort controller with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const { data } = await apiClient.post(
        `/v1/bookclub/${bookClubId}/books`,
        {
          googleBooksId: selectedBook.googleBooksId,
          status: status,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);
      logger.debug('Success response:', data);
      
      if (data.success) {
        onBookAdded(data.data);
        onClose();
      } else {
        toastError(data.error || 'Failed to add book');
      }
    } catch (err) {
      logger.error('Error adding book:', err);
      if (err.name === 'AbortError') {
        toastError('Request timed out. The server might be slow. Please try again.');
      } else if (err.message.includes('fetch')) {
        toastError('Network error: Unable to connect to server. Please check if the backend is running.');
      } else {
        toastError(`Failed to add book: ${err.message}`);
      }
    } finally {
      setAdding(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-700">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <FiBook size={14} />
            Add Book to BookClub
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <FiX size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, author, or ISBN..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="px-3 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-xs transition-colors"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {/* Selected Book Configuration */}
          {selectedBook && (
            <div className="mb-4 bg-gray-700 rounded-lg p-3 border border-indigo-500">
              <h3 className="text-white font-semibold text-xs uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <FiCheck className="text-green-400" size={13} />
                Selected Book
              </h3>
              <div className="flex gap-3 mb-3">
                <img
                  src={selectedBook.coverUrl || '/images/default.webp'}
                  alt={selectedBook.title}
                  className="w-14 h-20 object-cover rounded shadow"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/default.webp'; }}
                />
                <div className="flex-1">
                  <h4 className="text-white font-medium text-sm mb-0.5">{selectedBook.title}</h4>
                  <p className="text-gray-400 text-xs mb-0.5">{selectedBook.author}</p>
                  <p className="text-gray-500 text-[11px]">{selectedBook.pageCount} pages</p>
                </div>
              </div>

              {/* Status Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                <button
                  onClick={() => setStatus('current')}
                  className={`px-2.5 py-1.5 rounded text-xs transition-all ${
                    status === 'current'
                      ? 'bg-indigo-700 text-white ring-1 ring-indigo-500'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  Currently Reading
                </button>
                <button
                  onClick={() => setStatus('upcoming')}
                  className={`px-2.5 py-1.5 rounded text-xs transition-all ${
                    status === 'upcoming'
                      ? 'bg-indigo-600 text-white ring-1 ring-indigo-400'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  Coming Up Next
                </button>
                <button
                  onClick={() => setStatus('completed')}
                  className={`px-2.5 py-1.5 rounded text-xs transition-all ${
                    status === 'completed'
                      ? 'bg-green-600 text-white ring-1 ring-green-400'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  Completed
                </button>
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <FiCalendar size={12} />
                    Start Date {status !== 'completed' && '(optional)'}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <FiCalendar size={12} />
                    {status === 'completed' ? 'Finished Date' : 'Target End Date'} (optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full px-2.5 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                onClick={handleAddBook}
                disabled={adding}
                className="w-full mt-3 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-all text-xs"
              >
                {adding ? 'Adding Book...' : 'Add Book to BookClub'}
              </button>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-3">
                Search Results ({searchResults.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {searchResults.map((book) => (
                  <div
                    key={book.googleBooksId}
                    onClick={() => setSelectedBook(book)}
                    className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      selectedBook?.googleBooksId === book.googleBooksId
                        ? 'bg-indigo-700 ring-2 ring-indigo-500'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <img
                      src={book.coverUrl || '/images/default.webp'}
                      alt={book.title}
                      className="w-16 h-24 object-cover rounded shadow-md flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/default.webp'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                        {book.title}
                      </h4>
                      <p className="text-gray-300 text-xs mb-1">{book.author}</p>
                      <p className="text-gray-400 text-xs">{book.pageCount} pages</p>
                    </div>
                    {selectedBook?.googleBooksId === book.googleBooksId && (
                      <FiCheck className="text-green-400 flex-shrink-0" size={20} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {searchResults.length === 0 && !searching && (
            <div className="text-center text-gray-400 py-12">
              <FiSearch className="mx-auto text-6xl mb-4 opacity-30" />
              <p className="text-lg mb-2">Search for books to add</p>
              <p className="text-sm">Try searching by title, author, or ISBN</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddBookToBookclubModal;
