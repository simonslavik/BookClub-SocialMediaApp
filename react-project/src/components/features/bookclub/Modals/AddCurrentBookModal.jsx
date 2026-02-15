import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@context/index';
import { FiX, FiSearch, FiCalendar, FiClock } from 'react-icons/fi';
import apiClient from '@api/axios';
import logger from '@utils/logger';

const AddCurrentBookModal = ({ bookClubId, onClose, onBookAdded }) => {
  const { auth } = useContext(AuthContext);
  const [step, setStep] = useState(1); // 1: Search, 2: Schedule
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  
  // Schedule state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [readingDays, setReadingDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  // Auto-search with debouncing
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get(`/v1/books/search?q=${encodeURIComponent(query)}&limit=10`);
        if (data.success) {
          setSearchResults(data.data || []);
        }
      } catch (err) {
        logger.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Auto-calculate end date when start date or reading days change
  useEffect(() => {
    if (startDate && readingDays > 0) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + readingDays);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [startDate, readingDays]);

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setStep(2);
    // Set default start date to today
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
  };

  const handleSubmit = async () => {
    if (!selectedBook || !startDate || !endDate) return;

    setSubmitting(true);
    try {
      const { data } = await apiClient.post(`/v1/bookclub/${bookClubId}/books`, {
        googleBooksId: selectedBook.googleBooksId,
        status: 'current',
        startDate,
        endDate
      });

      if (data.success) {
        onBookAdded(data.data);
        onClose();
      } else {
        alert(data.error || 'Failed to add book');
      }
    } catch (err) {
      logger.error('Error adding book:', err);
      alert('Failed to add book to bookclub');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateDaysRemaining = () => {
    if (!endDate) return 0;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const calculatePagesPerDay = () => {
    if (!selectedBook?.pageCount || !readingDays || readingDays === 0) return 0;
    return Math.ceil(selectedBook.pageCount / readingDays);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <h2 className="text-2xl font-bold">
            {step === 1 ? '📚 Search for a Book' : '📅 Set Reading Schedule'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 ? (
            // Step 1: Search Books
            <>
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by title, author, or ISBN..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    autoFocus
                  />
                </div>
                {loading && (
                  <p className="mt-2 text-sm text-gray-500">Searching...</p>
                )}
              </div>

              {/* Search Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((book) => (
                  <button
                    key={book.googleBooksId}
                    onClick={() => handleSelectBook(book)}
                    className="flex gap-4 p-4 border rounded-lg hover:border-purple-500 hover:shadow-lg transition-all text-left"
                  >
                    <img
                      src={book.coverUrl || '/images/default.webp'}
                      alt={book.title}
                      className="w-20 h-28 object-cover rounded"
                      onError={(e) => { e.target.src = '/images/default.webp'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                      {book.pageCount && (
                        <p className="text-xs text-gray-500">{book.pageCount} pages</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {!loading && query && searchResults.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No books found. Try a different search term.
                </div>
              )}

              {!query && (
                <div className="text-center py-12 text-gray-400">
                  <FiSearch size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Start typing to search for books</p>
                </div>
              )}
            </>
          ) : (
            // Step 2: Set Schedule
            <div className="max-w-2xl mx-auto">
              {/* Selected Book Preview */}
              <div className="flex gap-6 mb-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                <img
                  src={selectedBook.coverUrl || '/images/default.webp'}
                  alt={selectedBook.title}
                  className="w-32 h-48 object-cover rounded-lg shadow-lg"
                />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedBook.title}
                  </h3>
                  <p className="text-lg text-gray-600 mb-4">{selectedBook.author}</p>
                  {selectedBook.pageCount && (
                    <p className="text-gray-700">
                      <span className="font-semibold">{selectedBook.pageCount}</span> pages
                    </p>
                  )}
                </div>
              </div>

              {/* Reading Schedule */}
              <div className="space-y-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">
                  📅 Reading Schedule
                </h4>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiCalendar className="inline mr-2" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>

                {/* Reading Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiClock className="inline mr-2" />
                    Reading Duration (days)
                  </label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="range"
                      min="7"
                      max="90"
                      value={readingDays}
                      onChange={(e) => setReadingDays(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min="7"
                      max="90"
                      value={readingDays}
                      onChange={(e) => setReadingDays(parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>

                {/* End Date (Auto-calculated) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>

                {/* Reading Stats */}
                {selectedBook.pageCount && readingDays > 0 && (
                  <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-600">
                        {calculatePagesPerDay()}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Pages per day</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">
                        {readingDays}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Days to complete</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Search
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !startDate || !endDate}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {submitting ? 'Adding Book...' : 'Start Reading!'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCurrentBookModal;
