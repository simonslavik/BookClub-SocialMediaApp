import { Request, Response, NextFunction } from 'express';
import { BookSearchService } from '../services/bookSearch.service';

/**
 * Search books via Google Books API
 */
export const searchBooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const q = req.query.q as string;
    const limit = Number(req.query.limit) || 10;
    const books = await BookSearchService.searchBooks(q, limit);
    res.json({ success: true, data: books });
  } catch (error) {
    next(error);
  }
};

/**
 * Get book details from Google Books
 */
export const getBookDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const googleBooksId = req.params.googleBooksId as string;
    const book = await BookSearchService.getBookDetails(googleBooksId);
    res.json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
};
