import { useState } from 'react';
import { FiStar, FiX } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';

/**
 * RateBookModal — interactive modal for rating a book 1-5 stars
 * @param {boolean} isOpen - whether the modal is visible
 * @param {function} onClose - callback to close
 * @param {function} onRate - callback(rating: number) when user submits
 * @param {function} onRemoveRating - callback to remove existing rating
 * @param {number|null} currentRating - user's existing rating or null
 * @param {string} bookTitle - name of the book being rated
 */
const RateBookModal = ({ isOpen, onClose, onRate, onRemoveRating, currentRating, bookTitle }) => {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedRating, setSelectedRating] = useState(currentRating || 0);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (selectedRating < 1) return;
    setSubmitting(true);
    try {
      await onRate(selectedRating);
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    setSubmitting(true);
    try {
      await onRemoveRating();
      setSelectedRating(0);
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Amazing'];
  const displayRating = hoveredStar || selectedRating;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Rate This Book</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Book title */}
        <p className="text-gray-300 text-sm mb-6 line-clamp-2">{bookTitle}</p>

        {/* Star picker */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setSelectedRating(star)}
                className="transition-transform hover:scale-125 focus:outline-none"
              >
                {(hoveredStar || selectedRating) >= star ? (
                  <FaStar className="text-3xl text-yellow-400 drop-shadow-lg" />
                ) : (
                  <FiStar className="text-3xl text-gray-500" />
                )}
              </button>
            ))}
          </div>
          {displayRating > 0 && (
            <span className="text-yellow-400 font-medium text-sm">
              {displayRating}/5 — {ratingLabels[displayRating]}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {currentRating && (
            <button
              onClick={handleRemove}
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Remove
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedRating < 1}
            className="flex-1 px-4 py-2 bg-stone-700 hover:bg-stone-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving...' : currentRating ? 'Update Rating' : 'Rate Book'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RateBookModal;
