import { FiStar } from 'react-icons/fi';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';

/**
 * StarRating — displays a read-only star rating (supports half-stars)
 * @param {number} rating - the average rating (0-5, can be decimal)
 * @param {number} totalRatings - how many ratings in total
 * @param {string} size - tailwind text size class (default 'text-sm')
 */
const StarRating = ({ rating = 0, totalRatings = 0, size = 'text-sm' }) => {
  const stars = [];

  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      // Full star
      stars.push(
        <FaStar key={i} className={`${size} text-yellow-400`} />
      );
    } else if (rating >= i - 0.5) {
      // Half star
      stars.push(
        <FaStarHalfAlt key={i} className={`${size} text-yellow-400`} />
      );
    } else {
      // Empty star
      stars.push(
        <FiStar key={i} className={`${size} text-gray-500`} />
      );
    }
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">{stars}</div>
      {totalRatings > 0 && (
        <span className="text-xs text-gray-400 ml-1">
          {rating.toFixed(1)} ({totalRatings})
        </span>
      )}
    </div>
  );
};

export default StarRating;
