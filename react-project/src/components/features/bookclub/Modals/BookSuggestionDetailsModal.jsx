import { FiX, FiTrash2, FiUser } from 'react-icons/fi';
import apiClient from '@api/axios';
import logger from '@utils/logger';

const BookSuggestionDetailsModal = ({ suggestion, bookClubId, auth, onClose, onDeleted }) => {
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this book suggestion?')) return;

    try {
      await apiClient.delete(
        `/v1/bookclub/${bookClubId}/suggestions/${suggestion.id}`
      );

      onDeleted();
      onClose();
    } catch (err) {
      logger.error('Error deleting suggestion:', err);
      alert(err.response?.data?.message || 'Failed to delete suggestion');
    }
  };

  // Check if user is the one who suggested this book
  const isOwnSuggestion = auth?.user?.id === suggestion.suggestedById;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Book Suggestion Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Book Cover */}
            <div className="flex-shrink-0">
              <img
                src={suggestion.book?.coverUrl || '/images/default.webp'}
                alt={suggestion.book?.title}
                className="w-48 h-72 object-cover rounded-lg shadow-xl"
                onError={(e) => { e.target.src = '/images/default.webp'; }}
              />
            </div>

            {/* Book Details */}
            <div className="flex-1">
              <h3 className="text-3xl font-bold text-white mb-2">
                {suggestion.book?.title}
              </h3>
              <p className="text-xl text-gray-300 mb-4">
                by {suggestion.book?.author}
              </p>

              {/* Book Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {suggestion.book?.pageCount && (
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-gray-400 text-sm">Pages</p>
                    <p className="text-white font-semibold">{suggestion.book.pageCount}</p>
                  </div>
                )}
                {suggestion.book?.publishedDate && (
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-gray-400 text-sm">Published</p>
                    <p className="text-white font-semibold">
                      {new Date(suggestion.book.publishedDate).getFullYear()}
                    </p>
                  </div>
                )}
              </div>

              {/* Suggestion Reason */}
              {suggestion.reason && (
                <div className="mb-6">
                  <h4 className="text-white font-semibold mb-2">Why this book?</h4>
                  <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-4">
                    <p className="text-gray-200 italic">"{suggestion.reason}"</p>
                  </div>
                </div>
              )}

              {/* Suggested By */}
              <div className="flex items-center gap-2 text-gray-400 mb-6">
                <FiUser size={16} />
                <span>Suggested by {suggestion.suggestedBy?.name}</span>
              </div>

              {/* Book Description */}
              {suggestion.book?.description && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Description</h4>
                  <p className="text-gray-300 leading-relaxed">
                    {suggestion.book.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-700 bg-gray-800 px-6 py-4 flex justify-between items-center">
          <div>
            {isOwnSuggestion && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FiTrash2 size={16} />
                Delete Suggestion
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookSuggestionDetailsModal;
