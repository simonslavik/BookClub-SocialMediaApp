import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireBookClubRole } from '../middleware/bookclubRoleMiddleware';
import { validate } from '../middleware/validate';
import {
  bookClubIdParamSchema,
  bookIdParamSchema,
  addBookForBookClubSchema,
  updateBookClubBookSchema,
  batchCurrentBooksSchema,
  bookClubBookIdParamSchema,
  rateBookClubBookSchema,
} from '../utils/validation';
import * as bookClubBooksController from '../controllers/bookClubBooksController';
import * as bookClubBookRatingController from '../controllers/bookClubBookRatingController';

const router = Router();

// Batch endpoint for fetching current books (public)
router.post(
  '/batch-current-books',
  validate({ body: batchCurrentBooksSchema }),
  bookClubBooksController.getBatchCurrentBooks
);

// Get books for a bookclub (public)
router.get(
  '/:bookClubId/books',
  validate({ params: bookClubIdParamSchema }),
  bookClubBooksController.getBookClubBooks
);

// Protected routes - require MODERATOR role or higher
router.post(
  '/:bookClubId/books',
  authMiddleware,
  requireBookClubRole('MODERATOR'),
  validate({ params: bookClubIdParamSchema, body: addBookForBookClubSchema }),
  bookClubBooksController.addBookClubBook
);

router.patch(
  '/:bookClubId/books/:bookId',
  authMiddleware,
  requireBookClubRole('MODERATOR'),
  validate({ params: bookClubIdParamSchema, body: updateBookClubBookSchema }),
  bookClubBooksController.updateBookClubBook
);

router.delete(
  '/:bookClubId/books/:bookId',
  authMiddleware,
  requireBookClubRole('MODERATOR'),
  validate({ params: bookClubIdParamSchema }),
  bookClubBooksController.deleteBookClubBook
);

// ====== Book Rating Routes (any authenticated member) ======

// Rate a bookclub book
router.post(
  '/:bookClubId/books/:bookClubBookId/rate',
  authMiddleware,
  validate({ params: bookClubBookIdParamSchema, body: rateBookClubBookSchema }),
  bookClubBookRatingController.rateBookClubBook
);

// Remove rating from a bookclub book
router.delete(
  '/:bookClubId/books/:bookClubBookId/rate',
  authMiddleware,
  validate({ params: bookClubBookIdParamSchema }),
  bookClubBookRatingController.removeBookClubBookRating
);

// Get rating info for a bookclub book
router.get(
  '/:bookClubId/books/:bookClubBookId/rating',
  authMiddleware,
  validate({ params: bookClubBookIdParamSchema }),
  bookClubBookRatingController.getBookClubBookRating
);

// Get all ratings for a bookclub book
router.get(
  '/:bookClubId/books/:bookClubBookId/ratings',
  authMiddleware,
  validate({ params: bookClubBookIdParamSchema }),
  bookClubBookRatingController.getAllBookClubBookRatings
);

export default router;
