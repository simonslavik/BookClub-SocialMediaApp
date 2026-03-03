import { Router } from 'express';
import { validate } from '../middleware/validate';
import { searchQuerySchema, googleBooksIdParamSchema } from '../utils/validation';
import * as bookSearchController from '../controllers/bookSearchController';

const router = Router();

// Search books via Google Books API
router.get(
  '/search',
  validate({ query: searchQuerySchema }),
  bookSearchController.searchBooks
);

// Get book details from Google Books
router.get(
  '/google/:googleBooksId',
  validate({ params: googleBooksIdParamSchema }),
  bookSearchController.getBookDetails
);

export default router;
