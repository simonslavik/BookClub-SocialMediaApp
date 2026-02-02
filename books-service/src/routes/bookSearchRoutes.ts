import { Router } from 'express';
import * as bookSearchController from '../controllers/bookSearchController';

const router = Router();

// Search books via Google Books API
router.get('/search', bookSearchController.searchBooks);

// Get book details from Google Books
router.get('/google/:googleBooksId', bookSearchController.getBookDetails);

export default router;
