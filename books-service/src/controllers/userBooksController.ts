import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { UserBooksService } from '../services/userBooks.service';
import { UserBookStatus } from '@prisma/client';

/**
 * Get user's books (with pagination)
 */
export const getUserBooks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, userId: queryUserId } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Allow viewing another user's library via ?userId=xxx
    const targetUserId = (queryUserId as string) || req.user!.userId;

    const result = await UserBooksService.getUserBooks(
      targetUserId,
      status as UserBookStatus | undefined,
      page,
      limit
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * Add book to user's library
 */
export const addUserBook = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { googleBooksId, status, rating, review } = req.body;
    const userBook = await UserBooksService.addUserBook(
      req.user!.userId,
      googleBooksId,
      status,
      rating,
      review
    );

    res.json({ success: true, data: userBook });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user book status/rating
 */
export const updateUserBook = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bookId = req.params.bookId as string;
    const { status, rating, review } = req.body;

    const userBook = await UserBooksService.updateUserBook(req.user!.userId, bookId, {
      status,
      rating,
      review,
    });

    res.json({ success: true, data: userBook });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove book from user's library (by userBookId)
 */
export const deleteUserBook = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userBookId = req.params.userBookId as string;
    await UserBooksService.deleteUserBookById(req.user!.userId, userBookId);
    res.json({ success: true, message: 'Book removed from library' });
  } catch (error) {
    next(error);
  }
};
