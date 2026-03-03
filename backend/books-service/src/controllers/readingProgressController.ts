import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { ReadingProgressService } from '../services/readingProgress.service';

/**
 * Get user's reading progress for a bookclub book
 */
export const getReadingProgress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bookClubBookId = req.params.bookClubBookId as string;
    const progress = await ReadingProgressService.getUserProgress(req.user!.userId, bookClubBookId);
    res.json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
};

/**
 * Update reading progress
 */
export const updateReadingProgress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bookClubBookId = req.params.bookClubBookId as string;
    const { pagesRead, notes } = req.body;

    const progress = await ReadingProgressService.updateProgress(
      req.user!.userId,
      bookClubBookId,
      pagesRead,
      notes
    );

    res.json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
};

/**
 * Add or update review for a bookclub book
 */
export const addOrUpdateReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bookClubBookId = req.params.bookClubBookId as string;
    const { rating, reviewText } = req.body;

    const review = await ReadingProgressService.addOrUpdateReview(
      req.user!.userId,
      bookClubBookId,
      rating,
      reviewText
    );

    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all reviews for a bookclub book
 */
export const getReviews = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bookClubBookId = req.params.bookClubBookId as string;
    const reviewData = await ReadingProgressService.getReviews(bookClubBookId);
    res.json({ success: true, data: reviewData });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user's review
 */
export const deleteReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bookClubBookId = req.params.bookClubBookId as string;
    await ReadingProgressService.deleteReview(req.user!.userId, bookClubBookId);
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};
