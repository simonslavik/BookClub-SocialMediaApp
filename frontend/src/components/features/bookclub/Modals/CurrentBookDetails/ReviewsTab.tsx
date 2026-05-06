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
      <div className="text-center py-6">
        <p className="text-gray-400 text-xs">Loading reviews…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Your Rating */}
      <div className="bg-white/[0.04] border border-white/[0.06] rounded-md p-3 mb-4">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
          {myReview ? 'Your Rating' : 'Rate this Book'}
        </h4>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition-colors"
              >
                <FiStar
                  size={18}
                  className={
                    star <= (hoverRating || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-600 hover:text-gray-500'
                  }
                />
              </button>
            ))}
          </div>
          {rating > 0 && <span className="text-xs text-gray-400">{rating}/5</span>}
        </div>

        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={2}
          maxLength={2000}
          className="w-full px-2.5 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2 resize-none"
          placeholder="Write a review (optional)…"
        />

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSaveReview}
            disabled={savingReview || rating === 0}
            className="px-2.5 py-1 bg-indigo-700 hover:bg-indigo-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-xs transition-colors"
          >
            {savingReview ? 'Saving…' : myReview ? 'Update' : 'Submit'}
          </button>
          {myReview && (
            <button
              onClick={handleDeleteReview}
              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
              title="Delete rating"
            >
              <FiTrash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* All Ratings */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            All Ratings ({reviews.length})
          </h4>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <FiStar className="text-yellow-400 fill-yellow-400" size={11} />
              <span className="font-medium text-gray-200">{averageRating.toFixed(1)}</span>
              <span className="text-gray-500">avg</span>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-8 bg-white/[0.02] rounded-md border border-white/[0.04]">
            <FiStar className="mx-auto text-2xl text-gray-600 mb-1.5" />
            <p className="text-gray-500 text-xs">No ratings yet. Be the first.</p>
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-md divide-y divide-white/[0.04]">
            {reviews.map((review) => {
              const isMe = review.userId === auth?.user?.id;
              const member = members.find((m) => m.id === review.userId);
              const memberName = isMe ? 'You' : (member?.username || `User ${review.userId.slice(0, 8)}`);
              const profileImg = getProfileImageUrl(member?.profileImage);
              return (
                <div key={review.id} className={`flex items-start gap-2 px-2.5 py-2 ${isMe ? 'bg-indigo-500/[0.06]' : ''}`}>
                  <img
                    src={profileImg || '/images/default-avatar.png'}
                    alt={memberName}
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0 cursor-pointer hover:ring-1 hover:ring-indigo-500 transition-all"
                    onClick={() => navigate(`/profile/${review.userId}`)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[13px] font-medium cursor-pointer hover:underline ${isMe ? 'text-indigo-300' : 'text-gray-200'}`}
                        onClick={() => navigate(`/profile/${review.userId}`)}
                      >
                        {memberName}
                      </span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            size={10}
                            className={
                              star <= review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-600'
                            }
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.reviewText && (
                      <p className="text-xs text-gray-400 mt-0.5 whitespace-pre-line leading-relaxed">{review.reviewText}</p>
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
