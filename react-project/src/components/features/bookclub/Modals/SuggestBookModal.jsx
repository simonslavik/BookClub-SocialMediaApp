import React, { useState } from 'react';
import { FiX, FiSearch, FiBook } from 'react-icons/fi';
import apiClient from '@api/axios';
import logger from '@utils/logger';

const SuggestBookModal = ({ isOpen, onClose, bookClubId, auth, onBookSuggested }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError('');

    try {
      const { data } = await apiClient.get(
        `/v1/books/search?q=${encodeURIComponent(searchQuery)}&limit=10`
      );

      const books = data.data || data.books || [];
      setSearchResults(books);
      if (books.length === 0) {
        setError('No books found. Try a different search term.');
      }
    } catch (err) {
      logger.error('Error searching books:', err);
      setError(err.response?.data?.error || 'Failed to connect to server');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSubmit = async () => {
    if (!selectedBook) {
      setError('Please select a book');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await apiClient.post(
        `/v1/bookclub/${bookClubId}/suggestions`,
        {
          googleBooksId: selectedBook.googleBooksId,
          reason: reason.trim() || null
        }
      );

      onBookSuggested && onBookSuggested(data.data);
      onClose();
    } catch (err) {
      logger.error('Error suggesting book:', err);
      setError(err.response?.data?.error || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 p-6 rounded-lg max-w-2xl w-full mx-4 border border-gray-700 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-bold flex items-center gap-2">
            <FiBook />
            Suggest a Book
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-500 text-red-200 rounded text-sm">
            {error}
          </div>
        )}

        {/* Selected Book Display */}
        {selectedBook ? (
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-gray-300 text-sm font-semibold">Selected Book</h3>
              <button
                onClick={() => setSelectedBook(null)}
                className="text-gray-400 hover:text-white text-sm"
              >
                Change
              </button>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 flex gap-4">
              <img
                src={selectedBook.coverUrl || '/images/default.webp'}
                alt={selectedBook.title}
                className="w-20 h-28 object-cover rounded shadow-md"
                onError={(e) => { e.target.src = '/images/default.webp'; }}
              />
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1">{selectedBook.title}</h4>
                <p className="text-gray-400 text-sm mb-2">{selectedBook.author}</p>
                {selectedBook.pageCount && (
                  <p className="text-gray-500 text-xs">{selectedBook.pageCount} pages</p>
                )}
                {selectedBook.description && (
                  <p className="text-gray-400 text-xs mt-2 line-clamp-3">
                    {selectedBook.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Search for a Book
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter book title or author..."
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={searching || !searchQuery.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <FiSearch size={16} />
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mb-4 max-h-96 overflow-y-auto">
                <h3 className="text-gray-300 text-sm font-semibold mb-2">Search Results</h3>
                <div className="space-y-2">
                  {searchResults.map((book) => (
                    <div
                      key={book.googleBooksId}
                      onClick={() => handleSelectBook(book)}
                      className="bg-gray-700 hover:bg-gray-600 rounded-lg p-3 cursor-pointer transition-colors flex gap-3"
                    >
                      <img
                        src={book.coverUrl || '/images/default.webp'}
                        alt={book.title}
                        className="w-12 h-16 object-cover rounded"
                        onError={(e) => { e.target.src = '/images/default.webp'; }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold text-sm line-clamp-1">
                          {book.title}
                        </h4>
                        <p className="text-gray-400 text-xs line-clamp-1">{book.author}</p>
                        {book.pageCount && (
                          <p className="text-gray-500 text-xs mt-1">{book.pageCount} pages</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Reason (Optional) */}
        <div className="mb-4">
          <label htmlFor="reason" className="block text-sm font-medium text-gray-300 mb-1">
            Why suggest this book? (Optional)
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Great characters, fits our theme, highly recommended..."
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedBook}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
          >
            {loading ? 'Suggesting...' : 'Suggest Book'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuggestBookModal;
