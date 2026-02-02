import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import * as bookClubBooksController from '../controllers/bookClubBooksController';

const router = Router();

// Get books for a bookclub (public)
router.get('/:bookClubId/books', bookClubBooksController.getBookClubBooks);

// Protected routes
router.post('/:bookClubId/books', authMiddleware, bookClubBooksController.addBookClubBook);
router.patch('/:bookClubId/books/:bookId', authMiddleware, bookClubBooksController.updateBookClubBook);
router.delete('/:bookClubId/books/:bookId', authMiddleware, bookClubBooksController.deleteBookClubBook);

export default router;
