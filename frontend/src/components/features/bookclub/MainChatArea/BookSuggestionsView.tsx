import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiThumbsUp, FiThumbsDown, FiStar, FiTrash2 } from 'react-icons/fi';
import SuggestBookModal from '../Modals/SuggestBookModal';
import BookSuggestionDetailsModal from '../Modals/BookSuggestionDetailsModal';
import apiClient from '@api/axios';
import logger from '@utils/logger';
import { getProfileImageUrl } from '@config/constants';

const BookSuggestionsView = ({ bookClubId, auth, members = [], userRole, onSuggestionAdded }) => {
  const navigate = useNavigate();
  const [bookSuggestions, setBookSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSuggestBook, setShowSuggestBook] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [suggestionLimit, setSuggestionLimit] = useState(null);
  const [suggestionsRemaining, setSuggestionsRemaining] = useState(null);

  useEffect(() => {
    fetchBookSuggestions();
  }, [bookClubId, auth?.token]);

  const fetchBookSuggestions = async () => {
    if (!bookClubId || !auth?.token) return;
    
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/v1/bookclub/${bookClubId}/suggestions`);
      if (data.success) {
        setBookSuggestions(data.data || []);
        if (data.limit != null) setSuggestionLimit(data.limit);
        if (data.remaining != null) setSuggestionsRemaining(data.remaining);
      }
    } catch (err) {
      logger.error('Error fetching book suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (suggestionId, voteType) => {
    try {
      const { data } = await apiClient.post(
        `/v1/bookclub/${bookClubId}/suggestions/${suggestionId}/vote`,
        { voteType }
      );
      const { vote, upvotes, downvotes } = data.data;
      // Update only the voted suggestion using actual server counts
      setBookSuggestions((prev) =>
        prev.map((s) =>
          s.id !== suggestionId
            ? s
            : { ...s, upvotes, downvotes, userVote: vote.voteType }
        )
      );
    } catch (err) {
      logger.error('Error voting:', err);
    }
  };

  const handleBookSuggested = () => {
    fetchBookSuggestions();
    setShowSuggestBook(false);
    if (onSuggestionAdded) onSuggestionAdded();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading suggestions...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-base font-semibold">Book Suggestions</h1>
            <p className="text-gray-400 text-xs mt-0.5">
              Vote for the books you'd like to read next
              {suggestionLimit != null && (
                <span className="ml-2 text-gray-500">
                  ({bookSuggestions.length}/{suggestionLimit})
                </span>
              )}
            </p>
          </div>
          {auth?.user && (
            <button
              onClick={() => setShowSuggestBook(true)}
              disabled={suggestionsRemaining != null && suggestionsRemaining <= 0}
              className={`px-2.5 py-1 text-white rounded-md transition-colors flex items-center gap-1.5 text-xs ${
                suggestionsRemaining != null && suggestionsRemaining <= 0
                  ? 'bg-gray-600 cursor-not-allowed opacity-50'
                  : 'bg-indigo-700 hover:bg-indigo-800'
              }`}
              title={suggestionsRemaining != null && suggestionsRemaining <= 0 ? 'Suggestion limit reached' : ''}
            >
              <FiPlus size={13} />
              Suggest a Book
            </button>
          )}
        </div>

        {/* Suggestions Grid */}
        {bookSuggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {bookSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                onClick={() => setSelectedSuggestion(suggestion)}
                className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-indigo-500 transition-all cursor-pointer overflow-hidden"
              >
                {/* Book Cover and Info */}
                <div className="flex gap-3 mb-3">
                  <img
                    src={suggestion.book?.coverUrl || '/images/default.webp'}
                    alt={suggestion.book?.title}
                    className="w-16 h-24 object-cover rounded shadow"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/default.webp'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                      {suggestion.book?.title}
                    </h3>
                    <p className="text-gray-400 text-xs mb-1">
                      {suggestion.book?.author}
                    </p>
                    {suggestion.book?.pageCount && (
                      <p className="text-gray-500 text-[11px]">
                        {suggestion.book.pageCount} pages
                      </p>
                    )}
                  </div>
                </div>

                {/* Reason */}
                {suggestion.reason && (
                  <div className="mb-3 p-2 bg-white/[0.04] rounded">
                    <p className="text-gray-300 text-xs italic">
                      "{suggestion.reason}"
                    </p>
                  </div>
                )}

                {/* Voting Section */}
                <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-between pt-3 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVote(suggestion.id, 'upvote')}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded transition-all text-xs ${
                        suggestion.userVote === 'upvote'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-green-600 hover:text-white'
                      }`}
                    >
                      <FiThumbsUp size={12} />
                      <span className="font-medium">{suggestion.upvotes || 0}</span>
                    </button>
                    <button
                      onClick={() => handleVote(suggestion.id, 'downvote')}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded transition-all text-xs ${
                        suggestion.userVote === 'downvote'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-red-600 hover:text-white'
                      }`}
                    >
                      <FiThumbsDown size={12} />
                      <span className="font-medium">{suggestion.downvotes || 0}</span>
                    </button>
                  </div>
                  <div
                    className="flex items-center gap-1.5 text-gray-400 text-[11px] cursor-pointer hover:text-indigo-500 transition-colors"
                    onClick={(e) => { e.stopPropagation(); navigate(`/profile/${suggestion.suggestedById || suggestion.suggestedBy?.id}`); }}
                  >
                    <img
                      src={getProfileImageUrl(members.find(m => m.id === (suggestion.suggestedById || suggestion.suggestedBy?.id))?.profileImage) || '/images/default-avatar.png'}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="hover:underline">{members.find(m => m.id === (suggestion.suggestedById || suggestion.suggestedBy?.id))?.username || suggestion.suggestedBy?.name || 'Unknown'}</span>
                  </div>
                </div>

                {/* Book Description (if available) */}
                {suggestion.book?.description && (
                  <div className="mt-3 pt-3 border-t border-gray-700 max-h-20 overflow-hidden">
                    <p className="text-gray-400 text-[11px] break-words leading-relaxed">
                      {suggestion.book.description.slice(0, 150)}
                      {suggestion.book.description.length > 150 && '…'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-white text-sm font-semibold mb-1">No suggestions yet</h3>
            <p className="text-gray-400 text-xs mb-4">Be the first to suggest a book for the club</p>
            {auth?.user && (
              <button
                onClick={() => setShowSuggestBook(true)}
                className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-md transition-colors inline-flex items-center gap-1.5 text-xs"
              >
                <FiPlus size={13} />
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

      {/* Book Suggestion Details Modal */}
      {selectedSuggestion && (
        <BookSuggestionDetailsModal
          suggestion={selectedSuggestion}
          bookClubId={bookClubId}
          auth={auth}
          members={members}
          userRole={userRole}
          onClose={() => setSelectedSuggestion(null)}
          onDeleted={fetchBookSuggestions}
        />
      )}
    </div>
  );
};

export default BookSuggestionsView;
