import { useState, useContext } from 'react';
import { FiSearch, FiX, FiBook, FiCalendar, FiCheck } from 'react-icons/fi';
import AuthContext from '../../../context/index';

const AddBookToBookclubModal = ({ bookClubId, onClose, onBookAdded }) => {
  const { auth } = useContext(AuthContext);
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
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=20`
      );
      const data = await response.json();
      
      const books = (data.items || [])
        .filter(item => item.id && item.volumeInfo) // Filter out items without ID or volumeInfo
        .map(item => ({
          googleBooksId: item.id,
          title: item.volumeInfo.title || 'Untitled',
          author: item.volumeInfo.authors?.[0] || 'Unknown Author',
          coverUrl: item.volumeInfo.imageLinks?.thumbnail || item.volumeInfo.imageLinks?.smallThumbnail || null,
          pageCount: item.volumeInfo.pageCount || 0,
          description: item.volumeInfo.description || ''
        }));
      
      setSearchResults(books);
    } catch (err) {
      console.error('Error searching books:', err);
      alert('Failed to search for books');
    } finally {
      setSearching(false);
    }
  };

  const handleAddBook = async () => {
    if (!selectedBook) return;

    if (!auth?.token) {
      alert('Please log in to add books');
      return;
    }

    if (!selectedBook.googleBooksId) {
      alert('Invalid book data - missing Google Books ID');
      return;
    }

    setAdding(true);
    try {
      console.log('Adding book with data:', {
        googleBooksId: selectedBook.googleBooksId,
        status: status,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });

      // Create an abort controller with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(
        `http://localhost:3000/v1/bookclub/${bookClubId}/books`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
          },
          body: JSON.stringify({
            googleBooksId: selectedBook.googleBooksId,
            status: status,
            startDate: startDate || undefined,
            endDate: endDate || undefined
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          const errorMsg = errorData.error || errorData.message || 'Failed to add book';
          
          // Check for specific error messages
          if (errorMsg.includes('Failed to fetch book details') || errorMsg.includes('Google Books')) {
            alert('Unable to fetch book details from Google Books. This might be a network issue with the backend server. The book has been selected but couldn\'t be added. Please try again in a moment.');
          } else {
            alert(errorMsg);
          }
        } catch {
          alert(`Server error: ${response.status} - ${errorText.substring(0, 100)}`);
        }
        return;
      }

      const data = await response.json();
      console.log('Success response:', data);
      
      if (data.success) {
        onBookAdded(data.data);
        onClose();
      } else {
        alert(data.error || 'Failed to add book');
      }
    } catch (err) {
      console.error('Error adding book:', err);
      if (err.name === 'AbortError') {
        alert('Request timed out. The server might be slow. Please try again.');
      } else if (err.message.includes('fetch')) {
        alert('Network error: Unable to connect to server. Please check if the backend is running.');
      } else {
        alert(`Failed to add book: ${err.message}`);
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiBook />
            Add Book to BookClub
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
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, author, or ISBN..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {/* Selected Book Configuration */}
          {selectedBook && (
            <div className="mb-6 bg-gray-700 rounded-lg p-4 border-2 border-purple-500">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <FiCheck className="text-green-400" />
                Selected Book
              </h3>
              <div className="flex gap-4 mb-4">
                <img
                  src={selectedBook.coverUrl || '/images/default.webp'}
                  alt={selectedBook.title}
                  className="w-20 h-28 object-cover rounded shadow-md"
                  onError={(e) => { e.target.src = '/images/default.webp'; }}
                />
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-1">{selectedBook.title}</h4>
                  <p className="text-gray-400 text-sm mb-2">{selectedBook.author}</p>
                  <p className="text-gray-400 text-xs">{selectedBook.pageCount} pages</p>
                </div>
              </div>

              {/* Status Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <button
                  onClick={() => setStatus('current')}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                    status === 'current'
                      ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  📖 Currently Reading
                </button>
                <button
                  onClick={() => setStatus('upcoming')}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                    status === 'upcoming'
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  📚 Coming Up Next
                </button>
                <button
                  onClick={() => setStatus('completed')}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                    status === 'completed'
                      ? 'bg-green-600 text-white ring-2 ring-green-400'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  ✅ Completed
                </button>
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1 flex items-center gap-1">
                    <FiCalendar size={14} />
                    Start Date {status !== 'completed' && '(optional)'}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1 flex items-center gap-1">
                    <FiCalendar size={14} />
                    {status === 'completed' ? 'Finished Date' : 'Target End Date'} (optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <button
                onClick={handleAddBook}
                disabled={adding}
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all font-semibold text-lg shadow-lg"
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
                        ? 'bg-purple-600 ring-2 ring-purple-400'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <img
                      src={book.coverUrl || '/images/default.webp'}
                      alt={book.title}
                      className="w-16 h-24 object-cover rounded shadow-md flex-shrink-0"
                      onError={(e) => { e.target.src = '/images/default.webp'; }}
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
    </div>
  );
};

export default AddBookToBookclubModal;
