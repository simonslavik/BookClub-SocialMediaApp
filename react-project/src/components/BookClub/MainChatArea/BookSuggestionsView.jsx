import React, { useState, useEffect } from 'react';
import { FiPlus, FiThumbsUp, FiThumbsDown, FiStar, FiTrash2 } from 'react-icons/fi';
import SuggestBookModal from '../Modals/SuggestBookModal';

const BookSuggestionsView = ({ bookClubId, auth }) => {
  const [bookSuggestions, setBookSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSuggestBook, setShowSuggestBook] = useState(false);

  useEffect(() => {
    fetchBookSuggestions();
  }, [bookClubId, auth?.token]);

  const fetchBookSuggestions = async () => {
    if (!bookClubId || !auth?.token) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/v1/bookclub/${bookClubId}/suggestions`,
        {
          headers: {
            'Authorization': `Bearer ${auth.token}`
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setBookSuggestions(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching book suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (suggestionId, voteType) => {
    try {
      const response = await fetch(
        `http://localhost:3000/v1/bookclub/${bookClubId}/suggestions/${suggestionId}/vote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
          },
          body: JSON.stringify({ voteType })
        }
      );
      
      if (response.ok) {
        // Refresh suggestions
        fetchBookSuggestions();
      }
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const handleBookSuggested = () => {
    fetchBookSuggestions();
    setShowSuggestBook(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading suggestions...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold flex items-center gap-2">
              <span className="text-3xl">📚</span>
              Book Suggestions
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Vote for the books you'd like to read next
            </p>
          </div>
          {auth?.user && (
            <button
              onClick={() => setShowSuggestBook(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
            >
              <FiPlus size={18} />
              Suggest a Book
            </button>
          )}
        </div>

        {/* Suggestions Grid */}
        {bookSuggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-purple-500 transition-all"
              >
                {/* Book Cover and Info */}
                <div className="flex gap-4 mb-4">
                  <img
                    src={suggestion.book?.coverUrl || '/images/default.webp'}
                    alt={suggestion.book?.title}
                    className="w-24 h-32 object-cover rounded shadow-lg"
                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-base line-clamp-2 mb-2">
                      {suggestion.book?.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">
                      {suggestion.book?.author}
                    </p>
                    {suggestion.book?.pageCount && (
                      <p className="text-gray-500 text-xs">
                        {suggestion.book.pageCount} pages
                      </p>
                    )}
                  </div>
                </div>

                {/* Reason */}
                {suggestion.reason && (
                  <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                    <p className="text-gray-300 text-sm italic">
                      "{suggestion.reason}"
                    </p>
                  </div>
                )}

                {/* Voting Section */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleVote(suggestion.id, 'upvote')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                        suggestion.userVote === 'upvote'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-green-600 hover:text-white'
                      }`}
                    >
                      <FiThumbsUp size={16} />
                      <span className="font-semibold">{suggestion.upvotes || 0}</span>
                    </button>
                    <button
                      onClick={() => handleVote(suggestion.id, 'downvote')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                        suggestion.userVote === 'downvote'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-red-600 hover:text-white'
                      }`}
                    >
                      <FiThumbsDown size={16} />
                      <span className="font-semibold">{suggestion.downvotes || 0}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <span>by {suggestion.suggestedBy?.name}</span>
                  </div>
                </div>

                {/* Book Description (if available) */}
                {suggestion.book?.description && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-gray-400 text-xs line-clamp-3">
                      {suggestion.book.description}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💡</div>
            <h3 className="text-white text-xl font-semibold mb-2">No suggestions yet</h3>
            <p className="text-gray-400 mb-6">Be the first to suggest a book for the club!</p>
            {auth?.user && (
              <button
                onClick={() => setShowSuggestBook(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-flex items-center gap-2 font-medium"
              >
                <FiPlus size={18} />
                Suggest a Book
              </button>
            )}
          </div>
        )}
      </div>

      {/* Suggest Book Modal */}
      {showSuggestBook && (
        <SuggestBookModal
          isOpen={showSuggestBook}
          onClose={() => setShowSuggestBook(false)}
          bookClubId={bookClubId}
          auth={auth}
          onBookSuggested={handleBookSuggested}
        />
      )}
    </div>
  );
};

export default BookSuggestionsView;
