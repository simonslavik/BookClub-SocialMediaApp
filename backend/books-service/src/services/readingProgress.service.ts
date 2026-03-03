import { ReadingProgressRepository } from '../repositories/readingProgress.repository';
import { BookClubBooksRepository } from '../repositories/bookClubBooks.repository';
import { BookClubReviewsRepository } from '../repositories/bookClubReviews.repository';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

export class ReadingProgressService {
  /**
   * Get user's reading progress for a bookclub book
   */
  static async getUserProgress(userId: string, bookClubBookId: string) {
    const [bookClubBook, progress] = await Promise.all([
      BookClubBooksRepository.findById(bookClubBookId),
      ReadingProgressRepository.findUserProgress(userId, bookClubBookId),
    ]);

    if (!bookClubBook) {
      throw new NotFoundError('Book in bookclub');
    }

    return progress;
  }

  /**
   * Update (upsert) reading progress
   */
  static async updateProgress(
    userId: string,
    bookClubBookId: string,
    pagesRead: number,
    notes?: string
  ) {
    const bookClubBook = await BookClubBooksRepository.findById(bookClubBookId);
    if (!bookClubBook) {
      throw new NotFoundError('Book in bookclub');
    }

    const totalPages = bookClubBook.book.pageCount || 100;

    const progress = await ReadingProgressRepository.upsertProgress(userId, bookClubBookId, {
      pagesRead,
      notes: notes ?? null,
    });

    // Compute percentage on the fly
    const percentage = Math.min(Math.round((pagesRead / totalPages) * 100), 100);

    logger.info('Reading progress updated:', { userId, bookClubBookId, pagesRead });
    return { ...progress, percentage };
  }

  /**
   * Get all reviews for a bookclub book with average rating
   */
  static async getReviews(bookClubBookId: string) {
    const [bookClubBook, reviews] = await Promise.all([
      BookClubBooksRepository.findById(bookClubBookId),
      BookClubReviewsRepository.findByBookClubBook(bookClubBookId),
    ]);

    if (!bookClubBook) {
      throw new NotFoundError('Book in bookclub');
    }
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    };
  }

  /**
   * Add or update a review
   */
  static async addOrUpdateReview(
    userId: string,
    bookClubBookId: string,
    rating: number,
    reviewText?: string
  ) {
    // Run existence check and upsert in parallel — upsert will fail with FK error if book doesn't exist
    const bookClubBook = await BookClubBooksRepository.findById(bookClubBookId);
    if (!bookClubBook) {
      throw new NotFoundError('Book in bookclub');
    }

    const review = await BookClubReviewsRepository.upsert(userId, bookClubBookId, {
      rating,
      reviewText: reviewText ?? null,
    });

    logger.info('Review posted:', { userId, bookClubBookId, rating });
    return review;
  }

  /**
   * Delete user's review
   */
  static async deleteReview(userId: string, bookClubBookId: string) {
    await BookClubReviewsRepository.delete(userId, bookClubBookId);
    logger.info('Review deleted:', { userId, bookClubBookId });
  }
}
