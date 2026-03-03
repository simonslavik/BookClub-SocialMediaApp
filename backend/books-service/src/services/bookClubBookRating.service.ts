import { BookClubBookRatingRepository } from '../repositories/bookClubBookRating.repository';
import { BookClubBooksRepository } from '../repositories/bookClubBooks.repository';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

export class BookClubBookRatingService {
  /**
   * Rate a bookclub book (upsert — create or update existing rating)
   */
  static async rateBook(bookClubBookId: string, userId: string, rating: number, reviewText?: string | null) {
    // Verify the bookclub book exists
    const bookClubBook = await BookClubBooksRepository.findById(bookClubBookId);
    if (!bookClubBook) {
      throw new NotFoundError('Book club book', bookClubBookId);
    }

    const result = await BookClubBookRatingRepository.upsert(bookClubBookId, userId, rating, reviewText);
    const summary = await BookClubBookRatingRepository.getSummary(bookClubBookId);

    logger.info('Book rated:', { bookClubBookId, userId, rating });

    return {
      userRating: result,
      summary,
    };
  }

  /**
   * Remove a user's rating
   */
  static async removeRating(bookClubBookId: string, userId: string) {
    // Check the rating exists before trying to delete
    const existing = await BookClubBookRatingRepository.findByUser(bookClubBookId, userId);
    if (!existing) {
      throw new NotFoundError('Rating');
    }

    await BookClubBookRatingRepository.delete(bookClubBookId, userId);
    const summary = await BookClubBookRatingRepository.getSummary(bookClubBookId);

    logger.info('Rating removed:', { bookClubBookId, userId });

    return { summary };
  }

  /**
   * Get rating info for a bookclub book (summary + current user's rating)
   */
  static async getRatingInfo(bookClubBookId: string, userId?: string) {
    const summary = await BookClubBookRatingRepository.getSummary(bookClubBookId);

    let userRating = null;
    if (userId) {
      const existing = await BookClubBookRatingRepository.findByUser(bookClubBookId, userId);
      userRating = existing?.rating ?? null;
    }

    return {
      ...summary,
      userRating,
    };
  }

  /**
   * Get all ratings for a bookclub book (for reviews list)
   */
  static async getAllRatings(bookClubBookId: string) {
    const bookClubBook = await BookClubBooksRepository.findById(bookClubBookId);
    if (!bookClubBook) {
      throw new NotFoundError('Book club book', bookClubBookId);
    }

    const ratings = await BookClubBookRatingRepository.findByBookClubBook(bookClubBookId);
    const summary = await BookClubBookRatingRepository.getSummary(bookClubBookId);

    return {
      ratings,
      ...summary,
    };
  }
}
