import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import * as userBooksController from '../controllers/userBooksController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get user's books
router.get('/', userBooksController.getUserBooks);

// Add book to user's library
router.post('/', userBooksController.addUserBook);

// Update user book
router.patch('/:bookId', userBooksController.updateUserBook);

// Remove book from user's library
router.delete('/:userBookId', userBooksController.deleteUserBook);

export default router;
