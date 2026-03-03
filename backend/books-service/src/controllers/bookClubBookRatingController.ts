import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { BookClubBookRatingService } from '../services/bookClubBookRating.service';

/**
 * Rate a bookclub book (POST /:bookClubId/books/:bookClubBookId/rate)
 */
export const rateBookClubBook = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bookClubBookId = req.params.bookClubBookId as string;
    const { rating, reviewText } = req.body;
    const userId = req.user!.userId;

    const result = await BookClubBookRatingService.rateBook(bookClubBookId, userId, rating, reviewText);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove rating from a bookclub book (DELETE /:bookClubId/books/:bookClubBookId/rate)
 */
export const removeBookClubBookRating = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bookClubBookId = req.params.bookClubBookId as string;
    const userId = req.user!.userId;

    const result = await BookClubBookRatingService.removeRating(bookClubBookId, userId);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Get rating info for a bookclub book (GET /:bookClubId/books/:bookClubBookId/rating)
 */
export const getBookClubBookRating = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bookClubBookId = req.params.bookClubBookId as string;
    const userId = req.user?.userId;

    const result = await BookClubBookRatingService.getRatingInfo(bookClubBookId, userId);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all ratings for a bookclub book (GET /:bookClubId/books/:bookClubBookId/ratings)
 */
export const getAllBookClubBookRatings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bookClubBookId = req.params.bookClubBookId as string;

    const result = await BookClubBookRatingService.getAllRatings(bookClubBookId);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
