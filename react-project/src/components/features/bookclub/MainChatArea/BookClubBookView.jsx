
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
        className={`bg-gray-800 rounded-lg p-4 border ${borderColor} hover:bg-gray-700 transition-colors relative`}
        onMouseEnter={() => setHoveredBookId(bookClubBook.id)}
        onMouseLeave={() => setHoveredBookId(null)}
      >
        {/* Rate button — appears on hover */}
        {isHovered && (
          <button
            onClick={(e) => handleOpenRateModal(e, bookClubBook)}
            className="absolute top-2 right-2 z-10 p-1.5 bg-gray-900/80 hover:bg-yellow-500/20 rounded-full transition-all border border-gray-600 hover:border-yellow-500"
            title="Rate this book"
          >
            {userRating ? (
              <FaStar className="text-yellow-400 text-sm" />
            ) : (
              <FiStar className="text-gray-300 hover:text-yellow-400 text-sm" />
            )}
          </button>
        )}

        <div 
          onClick={() => {
            setCurrentBookData(bookClubBook);
            setCurrentBookDetailsOpen(true);
          }}
          className="flex gap-3 cursor-pointer mb-3"
        >
          <img
            src={bookClubBook.book?.coverUrl || '/images/default.webp'}
            alt={bookClubBook.book?.title}
            className="w-20 h-28 object-cover rounded shadow-md"
            onError={(e) => { e.target.src = '/images/default.webp'; }}
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
              {bookClubBook.book?.title}
            </h4>
            <p className="text-gray-400 text-xs mb-2">
              {bookClubBook.book?.author}
            </p>

            {/* Rating display */}
            {totalRatings > 0 && (
              <StarRating rating={averageRating} totalRatings={totalRatings} size="text-xs" />
            )}

            {/* Date info */}
            {bookClubBook.status === 'current' && bookClubBook.startDate && bookClubBook.endDate && (
              <p className="text-xs text-purple-400 mt-1">
                {new Date(bookClubBook.startDate).toLocaleDateString()} - {new Date(bookClubBook.endDate).toLocaleDateString()}
              </p>
            )}
            {bookClubBook.status === 'upcoming' && bookClubBook.startDate && (
              <p className="text-xs text-blue-400 mt-1">
                Starts: {new Date(bookClubBook.startDate).toLocaleDateString()}
              </p>
            )}
            {bookClubBook.status === 'completed' && bookClubBook.endDate && (
              <p className="text-xs text-green-400 mt-1">
                Finished: {new Date(bookClubBook.endDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <select
          value={bookClubBook.status}
          onChange={(e) => handleStatusChange(bookClubBook.bookId, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className={`w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-2 ${focusRingColor}`}
        >
          <option value="current">📖 Currently Reading</option>
          <option value="upcoming">📚 Coming Up Next</option>
          <option value="completed">✅ Completed</option>
        </select>
      </div>
    );
  };

  const ratingBookUserRating = ratingBookData ? getRatingInfo(ratingBookData).userRating : null;

  const canManageBooks = userRole && ['OWNER', 'ADMIN', 'MODERATOR'].includes(userRole);

  return (
    <div className="space-y-6">
        {canManageBooks && (
        <div className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 cursor-pointer"
            onClick={() => setShowAddBookModal(true)}
            >
            <FiPlus size={20} />
            Add New Book to Bookclub
        </div>
        )}
        {/* Current Book */}
        {bookclubBooks.current.length > 0 && (
        <div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">📖</span> Currently Reading
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookclubBooks.current.map(b => renderBookCard(b, 'border-purple-500', 'focus:ring-purple-500'))}
            </div>
        </div>
        )}

        {/* Upcoming Books */}
        {bookclubBooks.upcoming.length > 0 && (
        <div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">📚</span> Coming Up Next
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookclubBooks.upcoming.map(b => renderBookCard(b, 'border-blue-500', 'focus:ring-blue-500'))}
            </div>
        </div>
        )}

        {/* Completed Books */}
        {bookclubBooks.completed.length > 0 && (
        <div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">✅</span> Completed
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookclubBooks.completed.map(b => renderBookCard(b, 'border-green-500', 'focus:ring-green-500'))}
            </div>
        </div>
        )}

        {/* Empty State */}
        {bookclubBooks.current.length === 0 && bookclubBooks.upcoming.length === 0 && bookclubBooks.completed.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
            <FiStar className="mx-auto text-4xl mb-2 opacity-30" />
            <p className="text-sm">No books added yet</p>
            <p className="text-xs mt-1">Add a current book to get started!</p>
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