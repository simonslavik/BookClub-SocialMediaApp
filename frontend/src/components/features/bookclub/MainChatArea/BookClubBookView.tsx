
import { useState } from 'react';
import { FiPlus, FiStar } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import StarRating from '../rating/StarRating';
import RateBookModal from '../rating/RateBookModal';

const BookClubBookView = ({ 
  setShowAddBookModal, 
  bookclubBooks, 
  setCurrentBookData, 
  setCurrentBookDetailsOpen, 
  handleStatusChange, 
  onRateBook, 
  onRemoveRating, 
  currentUserId,
  userRole 
}) => {
  const [hoveredBookId, setHoveredBookId] = useState(null);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [ratingBookData, setRatingBookData] = useState(null);

  // Compute average rating and user's rating from the ratings array
  const getRatingInfo = (bookClubBook) => {
    const ratings = bookClubBook.ratings || [];
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0 
      ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings) * 10) / 10 
      : 0;
    const userRating = ratings.find(r => r.userId === currentUserId)?.rating || null;
    return { averageRating, totalRatings, userRating };
  };

  const handleOpenRateModal = (e, bookClubBook) => {
    e.stopPropagation();
    setRatingBookData(bookClubBook);
    setRateModalOpen(true);
  };

  const handleRate = async (rating) => {
    if (!ratingBookData) return;
    await onRateBook(ratingBookData.id, rating);
  };

  const handleRemoveRating = async () => {
    if (!ratingBookData) return;
    await onRemoveRating(ratingBookData.id);
  };

  // Renders a single book card with ratings
  const renderBookCard = (bookClubBook, borderColor, focusRingColor) => {
    const { averageRating, totalRatings, userRating } = getRatingInfo(bookClubBook);
    const isHovered = hoveredBookId === bookClubBook.id;

    return (
      <div
        key={bookClubBook.id}
        className={`bg-gray-800 rounded-lg p-3 border ${borderColor} hover:bg-gray-700 transition-colors relative`}
        onMouseEnter={() => setHoveredBookId(bookClubBook.id)}
        onMouseLeave={() => setHoveredBookId(null)}
      >
        {/* Rate button — appears on hover */}
        {isHovered && (
          <button
            onClick={(e) => handleOpenRateModal(e, bookClubBook)}
            className="absolute top-1.5 right-1.5 z-10 p-1 bg-gray-900/80 hover:bg-yellow-500/20 rounded-full transition-all border border-gray-600 hover:border-yellow-500"
            title="Rate this book"
          >
            {userRating ? (
              <FaStar className="text-yellow-400 text-xs" />
            ) : (
              <FiStar className="text-gray-300 hover:text-yellow-400 text-xs" />
            )}
          </button>
        )}

        <div
          onClick={() => {
            setCurrentBookData(bookClubBook);
            setCurrentBookDetailsOpen(true);
          }}
          className="flex gap-2.5 cursor-pointer mb-2"
        >
          <img
            src={bookClubBook.book?.coverUrl || '/images/default.webp'}
            alt={bookClubBook.book?.title}
            className="w-14 h-20 object-cover rounded shadow"
            onError={(e) => { (e.target as HTMLImageElement).src = '/images/default.webp'; }}
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium text-sm line-clamp-2 mb-0.5">
              {bookClubBook.book?.title}
            </h4>
            <p className="text-gray-400 text-xs mb-1.5">
              {bookClubBook.book?.author}
            </p>

            {/* Rating display */}
            {totalRatings > 0 && (
              <StarRating rating={averageRating} totalRatings={totalRatings} size="text-xs" />
            )}

            {/* Date info */}
            {bookClubBook.status === 'current' && bookClubBook.startDate && bookClubBook.endDate && (
              <p className="text-[11px] text-indigo-400 mt-1">
                {new Date(bookClubBook.startDate).toLocaleDateString()} – {new Date(bookClubBook.endDate).toLocaleDateString()}
              </p>
            )}
            {bookClubBook.status === 'upcoming' && bookClubBook.startDate && (
              <p className="text-[11px] text-indigo-400 mt-1">
                Starts: {new Date(bookClubBook.startDate).toLocaleDateString()}
              </p>
            )}
            {bookClubBook.status === 'completed' && bookClubBook.endDate && (
              <p className="text-[11px] text-green-400 mt-1">
                Finished: {new Date(bookClubBook.endDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <select
          value={bookClubBook.status}
          onChange={(e) => handleStatusChange(bookClubBook.bookId, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className={`w-full px-2.5 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-2 ${focusRingColor}`}
        >
          <option value="current">Currently Reading</option>
          <option value="upcoming">Coming Up Next</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    );
  };

  const ratingBookUserRating = ratingBookData ? getRatingInfo(ratingBookData).userRating : null;

  const canManageBooks = userRole && ['OWNER', 'ADMIN', 'MODERATOR'].includes(userRole);

  return (
    <div className="space-y-4 p-4">
        {canManageBooks && (
        <button
            onClick={() => setShowAddBookModal(true)}
            className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-md transition-colors flex items-center gap-1.5 text-xs"
        >
            <FiPlus size={13} />
            Add New Book to Bookclub
        </button>
        )}
        {/* Current Book */}
        {bookclubBooks.current.length > 0 && (
        <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              Currently Reading
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {bookclubBooks.current.map(b => renderBookCard(b, 'border-indigo-500', 'focus:ring-indigo-500'))}
            </div>
        </div>
        )}

        {/* Upcoming Books */}
        {bookclubBooks.upcoming.length > 0 && (
        <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              Coming Up Next
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {bookclubBooks.upcoming.map(b => renderBookCard(b, 'border-indigo-500', 'focus:ring-indigo-500'))}
            </div>
        </div>
        )}

        {/* Completed Books */}
        {bookclubBooks.completed.length > 0 && (
        <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              Completed
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {bookclubBooks.completed.map(b => renderBookCard(b, 'border-green-500', 'focus:ring-green-500'))}
            </div>
        </div>
        )}

        {/* Empty State */}
        {bookclubBooks.current.length === 0 && bookclubBooks.upcoming.length === 0 && bookclubBooks.completed.length === 0 && (
        <div className="text-center text-gray-500 mt-12">
            <FiStar className="mx-auto text-2xl mb-2 opacity-30" />
            <p className="text-sm">No books added yet</p>
            <p className="text-xs mt-1 text-gray-600">Add a current book to get started</p>
        </div>
        )}

        {/* Rate Book Modal */}
        <RateBookModal
          isOpen={rateModalOpen}
          onClose={() => {
            setRateModalOpen(false);
            setRatingBookData(null);
          }}
          onRate={handleRate}
          onRemoveRating={handleRemoveRating}
          currentRating={ratingBookUserRating}
          bookTitle={ratingBookData?.book?.title || ''}
        />
    </div>
  )
}

export default BookClubBookView;