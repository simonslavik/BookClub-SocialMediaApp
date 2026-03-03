import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import {
  addBookSchema,
  updateBookSchema,
  bookIdParamSchema,
  userBookIdParamSchema,
} from '../utils/validation';
import * as userBooksController from '../controllers/userBooksController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get user's books
router.get('/', userBooksController.getUserBooks);

// Add book to user's library
router.post(
  '/',
  validate({ body: addBookSchema }),
  userBooksController.addUserBook
);

// Update user book
router.patch(
  '/:bookId',
  validate({ params: bookIdParamSchema, body: updateBookSchema }),
  userBooksController.updateUserBook
);

// Remove book from user's library
router.delete(
  '/:userBookId',
  validate({ params: userBookIdParamSchema }),
  userBooksController.deleteUserBook
);

export default router;
