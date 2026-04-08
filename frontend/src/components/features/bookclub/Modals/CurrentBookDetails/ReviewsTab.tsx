import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@context/index';
import { FiStar, FiTrash2 } from 'react-icons/fi';
import apiClient from '@api/axios';
import logger from '@utils/logger';
import { getProfileImageUrl } from '@config/constants';
import { useConfirm, useToast } from '@hooks/useUIFeedback';

const ReviewsTab = ({ currentBookData, members = [] }) => {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { toastSuccess, toastError, toastWarning } = useToast();

  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  const fetchRatings = async () => {
    if (!currentBookData?.id || !currentBookData?.bookClubId) return;

    setLoadingReviews(true);
    try {
      const { data } = await apiClient.get(
        `/v1/bookclub/${currentBookData.bookClubId}/books/${currentBookData.id}/ratings`,
      );

      if (data.success) {
        setReviews(data.data.ratings || []);
        setAverageRating(data.data.averageRating || 0);

        if (auth?.user) {
          const userRating = data.data.ratings.find((r) => r.userId === auth.user.id);
          if (userRating) {
            setMyReview(userRating);
            setRating(userRating.rating);
            setReviewText(userRating.reviewText || '');
          }
        }
      }
    } catch (err) {
      logger.error('Error fetching ratings:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [currentBookData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveReview = async () => {
    if (!currentBookData?.id || !currentBookData?.bookClubId || !auth?.token || rating === 0) {
      toastWarning('Please select a rating');
      return;
    }

    setSavingReview(true);
    try {
      const { data } = await apiClient.post(
        `/v1/bookclub/${currentBookData.bookClubId}/books/${currentBookData.id}/rate`,
        { rating, reviewText: reviewText || null },
      );

      if (data.success) {
        setMyReview(data.data.userRating);
        await fetchRatings();
        toastSuccess('Rating saved!');
      }
    } catch (err) {
      logger.error('Error saving rating:', err);
      toastError('Failed to save rating');
    } finally {
      setSavingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!currentBookData?.id || !currentBookData?.bookClubId || !auth?.token) return;
    const ok = await confirm('Are you sure you want to delete your rating?', {
      title: 'Delete Rating', variant: 'danger', confirmLabel: 'Delete',
    });
    if (!ok) return;

    try {
      const { data } = await apiClient.delete(
        `/v1/bookclub/${currentBookData.bookClubId}/books/${currentBookData.id}/rate`,
      );

      if (data.success) {
        setMyReview(null);
        setRating(0);
        setReviewText('');
        await fetchRatings();
      }
    } catch (err) {
      logger.error('Error deleting rating:', err);
      toastError('Failed to delete rating');
    }
  };

  if (loadingReviews) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Your Rating */}
      <div className="bg-gradient-to-r from-stone-50 to-warmgray-100 rounded-lg p-5 mb-6">
        <h4 className="text-base font-semibold text-gray-900 mb-3">
          {myReview ? 'Your Rating' : 'Rate this Book'}
        </h4>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <FiStar
                  size={24}
                  className={
                    star <= (hoverRating || rating)
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-gray-300'
                  }
                />
              </button>
            ))}
          </div>
          {rating > 0 && <span className="text-sm text-gray-600">{rating}/5</span>}
        </div>

        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={2}
          maxLength={2000}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 text-sm mb-3"
          placeholder="Write a review (optional)..."
        />

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveReview}
            disabled={savingReview || rating === 0}
            className="px-4 py-2 bg-stone-700 hover:bg-stone-800 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {savingReview ? 'Saving...' : myReview ? 'Update' : 'Submit'}
          </button>
          {myReview && (
            <button
              onClick={handleDeleteReview}
              className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
            >
              <FiTrash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* All Ratings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-base font-semibold text-gray-900">
            All Ratings ({reviews.length})
          </h4>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <FiStar className="text-yellow-500 fill-yellow-500" size={14} />
              <span className="font-semibold">{averageRating.toFixed(1)}</span>
              <span>avg</span>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <FiStar className="mx-auto text-3xl text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">No ratings yet. Be the first!</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {reviews.map((review) => {
              const isMe = review.userId === auth?.user?.id;
              const member = members.find((m) => m.id === review.userId);
              const memberName = isMe ? 'You' : (member?.username || `User ${review.userId.slice(0, 8)}`);
              const profileImg = getProfileImageUrl(member?.profileImage);
              return (
                <div key={review.id} className={`flex items-start gap-3 px-4 py-3 ${isMe ? 'bg-stone-50' : ''}`}>
                  <img
                    src={profileImg || '/images/default-avatar.png'}
                    alt={memberName}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-stone-500 transition-all"
                    onClick={() => navigate(`/profile/${review.userId}`)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium cursor-pointer hover:underline ${isMe ? 'text-stone-800' : 'text-gray-900'}`}
                        onClick={() => navigate(`/profile/${review.userId}`)}
                      >
                        {memberName}
                      </span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            size={12}
                            className={
                              star <= review.rating
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-300'
                            }
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.reviewText && (
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{review.reviewText}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsTab;
