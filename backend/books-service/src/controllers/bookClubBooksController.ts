import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { BookClubBooksService } from '../services/bookClubBooks.service';
import { BookClubBookStatus } from '@prisma/client';

/**
 * Get books for a bookclub (with pagination)
 */
export const getBookClubBooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bookClubId = req.params.bookClubId as string;
    const { status } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await BookClubBooksService.getBookClubBooks(
      bookClubId,
      status as BookClubBookStatus | undefined,
      page,
      limit
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * Add book to bookclub
 */
export const addBookClubBook = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bookClubId = req.params.bookClubId as string;
    const { googleBooksId, status = BookClubBookStatus.upcoming, startDate, endDate } = req.body;

    const bookClubBook = await BookClubBooksService.addBookClubBook(
      bookClubId,
      req.user!.userId,
      googleBooksId,
      status,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    res.json({ success: true, data: bookClubBook });
  } catch (error) {
    next(error);
  }
};

/**
 * Update bookclub book status
 */
export const updateBookClubBook = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bookClubId = req.params.bookClubId as string;
    const bookId = req.params.bookId as string;
    const { status, startDate, endDate } = req.body;

    const bookClubBook = await BookClubBooksService.updateBookClubBook(
      bookClubId,
      bookId,
      {
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      }
    );

    res.json({ success: true, data: bookClubBook });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete book from bookclub
 */
export const deleteBookClubBook = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bookClubId = req.params.bookClubId as string;
    const bookId = req.params.bookId as string;
    await BookClubBooksService.deleteBookClubBook(bookClubId, bookId);
    res.json({ success: true, message: 'Book removed from bookclub' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current books for multiple bookclubs (batch)
 */
export const getBatchCurrentBooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { bookClubIds } = req.body;
    const currentBooks = await BookClubBooksService.getBatchCurrentBooks(bookClubIds);
    res.json({ success: true, currentBooks });
  } catch (error) {
    next(error);
  }
};
