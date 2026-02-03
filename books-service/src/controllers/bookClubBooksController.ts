import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { BookClubBooksService } from '../services/bookClubBooks.service';
import {
  bookClubIdParamSchema,
  bookIdParamSchema,
  addBookForBookClubSchema,
  updateBookClubBookSchema
} from '../utils/validation';

/**
 * Get books for a bookclub
 */
export const getBookClubBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookClubId } = req.params;
    const { status } = req.query;

    const books = await BookClubBooksService.getBookClubBooks(bookClubId as string, status as string);
    res.json({ success: true, data: books });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Add book to bookclub
 */
export const addBookClubBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const paramValidation = bookClubIdParamSchema.validate(req.params);
    if (paramValidation.error) {
      res.status(400).json({ error: paramValidation.error.details[0].message });
      return;
    }

    const bodyValidation = addBookForBookClubSchema.validate(req.body);
    if (bodyValidation.error) {
      res.status(400).json({ error: bodyValidation.error.details[0].message });
      return;
    }

    const { bookClubId } = req.params;
    const { googleBooksId, status = 'upcoming', startDate, endDate } = req.body;

    const bookClubBook = await BookClubBooksService.addBookClubBook(
      bookClubId as string,
      req.user!.userId,
      googleBooksId,
      status,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    res.json({ success: true, data: bookClubBook });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update bookclub book status
 */
export const updateBookClubBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const paramValidation = bookClubIdParamSchema.validate({ bookClubId: req.params.bookClubId });
    if (paramValidation.error) {
      res.status(400).json({ error: paramValidation.error.details[0].message });
      return;
    }

    const bookIdValidation = bookIdParamSchema.validate({ bookId: req.params.bookId });
    if (bookIdValidation.error) {
      res.status(400).json({ error: bookIdValidation.error.details[0].message });
      return;
    }

    const bodyValidation = updateBookClubBookSchema.validate(req.body);
    if (bodyValidation.error) {
      res.status(400).json({ error: bodyValidation.error.details[0].message });
      return;
    }

    const { bookClubId, bookId } = req.params;
    const { status, startDate, endDate } = req.body;

    const bookClubBook = await BookClubBooksService.updateBookClubBook(
      bookClubId as string,
      bookId as string,
      {
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      }
    );

    res.json({ success: true, data: bookClubBook });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Delete book from bookclub
 */
export const deleteBookClubBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const paramValidation = bookClubIdParamSchema.validate({ bookClubId: req.params.bookClubId });
    if (paramValidation.error) {
      res.status(400).json({ error: paramValidation.error.details[0].message });
      return;
    }

    const bookIdValidation = bookIdParamSchema.validate({ bookId: req.params.bookId });
    if (bookIdValidation.error) {
      res.status(400).json({ error: bookIdValidation.error.details[0].message });
      return;
    }

    const { bookClubId, bookId } = req.params;
    await BookClubBooksService.deleteBookClubBook(bookClubId as string, bookId as string);
    res.json({ success: true, message: 'Book removed from bookclub' });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Get current books for multiple bookclubs (batch)
 */
export const getBatchCurrentBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookClubIds } = req.body;

    if (!Array.isArray(bookClubIds)) {
      res.status(400).json({ error: 'bookClubIds must be an array' });
      return;
    }

    const currentBooks = await BookClubBooksService.getBatchCurrentBooks(bookClubIds);
    res.json({ success: true, currentBooks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
