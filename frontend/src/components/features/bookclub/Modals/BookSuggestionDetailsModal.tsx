import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { FiX, FiTrash2 } from 'react-icons/fi';
import apiClient from '@api/axios';
import logger from '@utils/logger';
import { getProfileImageUrl } from '@config/constants';
import { useConfirm, useToast } from '@hooks/useUIFeedback';

const BookSuggestionDetailsModal = ({ suggestion, bookClubId, auth, members = [], userRole, onClose, onDeleted }: any) => {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { toastError } = useToast();

  const suggesterId = suggestion.suggestedById || suggestion.suggestedBy?.id;
  const suggesterMember = members.find(m => m.id === suggesterId);
  const suggesterName = suggesterMember?.username || suggestion.suggestedBy?.name || 'Unknown';
  const suggesterImage = getProfileImageUrl(suggesterMember?.profileImage);

  const handleDelete = async () => {
    const ok = await confirm('Are you sure you want to delete this book suggestion?', { title: 'Delete Suggestion', variant: 'danger', confirmLabel: 'Delete' });
    if (!ok) return;

    try {
      await apiClient.delete(
        `/v1/bookclub/${bookClubId}/suggestions/${suggestion.id}`
      );

      onDeleted();
      onClose();
    } catch (err) {
      logger.error('Error deleting suggestion:', err);
      toastError(err.response?.data?.message || 'Failed to delete suggestion');
    }
  };

  // Check if user is the suggester or has moderator+ role
  const isOwnSuggestion = auth?.user?.id === suggestion.suggestedById;
  const isModerator = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'MODERATOR';
  const canDelete = isOwnSuggestion || isModerator;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-white">Book Suggestion Details</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            <FiX size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Book Cover */}
            <div className="flex-shrink-0">
              <img
                src={suggestion.book?.coverUrl || '/images/default.webp'}
                alt={suggestion.book?.title}
                className="w-32 h-48 object-cover rounded shadow-lg"
                onError={(e) => { (e.target as HTMLImageElement).src = '/images/default.webp'; }}
              />
            </div>

            {/* Book Details */}
            <div className="flex-1">
              <h3 className="text-base font-semibold text-white mb-1">
                {suggestion.book?.title}
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                by {suggestion.book?.author}
              </p>

              {/* Book Info */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {suggestion.book?.pageCount && (
                  <div className="bg-gray-800 rounded p-2">
                    <p className="text-gray-500 text-[11px] uppercase tracking-wider">Pages</p>
                    <p className="text-gray-200 text-sm font-medium">{suggestion.book.pageCount}</p>
                  </div>
                )}
                {suggestion.book?.publishedDate && (
                  <div className="bg-gray-800 rounded p-2">
                    <p className="text-gray-500 text-[11px] uppercase tracking-wider">Published</p>
                    <p className="text-gray-200 text-sm font-medium">
                      {new Date(suggestion.book.publishedDate).getFullYear()}
                    </p>
                  </div>
                )}
              </div>

              {/* Suggestion Reason */}
              {suggestion.reason && (
                <div className="mb-4">
                  <h4 className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold mb-1.5">Why this book?</h4>
                  <div className="bg-indigo-950/30 border border-indigo-800/50 rounded p-2.5">
                    <p className="text-gray-200 text-xs italic">"{suggestion.reason}"</p>
                  </div>
                </div>
              )}

              {/* Suggested By */}
              <div
                className="flex items-center gap-2 mb-4 cursor-pointer group"
                onClick={() => navigate(`/profile/${suggesterId}`)}
              >
                <span className="text-gray-500 text-xs">Suggested by</span>
                <span className="text-gray-400 group-hover:text-indigo-500 transition-colors flex items-center gap-1.5">
                  <img
                    src={suggesterImage || '/images/default-avatar.png'}
                    alt={suggesterName}
                    className="w-6 h-6 rounded-full object-cover group-hover:ring-1 group-hover:ring-indigo-500 transition-all"
                  />
                  <span className="text-xs font-medium text-gray-300 group-hover:underline">{suggesterName}</span>
                </span>
              </div>

              {/* Book Description */}
              {suggestion.book?.description && (
                <div>
                  <h4 className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold mb-1.5">Description</h4>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    {suggestion.book.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-700 bg-gray-800 px-4 py-3 flex justify-between items-center">
          <div>
            {canDelete && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                title={isOwnSuggestion ? 'Delete your suggestion' : 'Delete (moderator action)'}
              >
                <FiTrash2 size={12} />
                Delete Suggestion
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BookSuggestionDetailsModal;
