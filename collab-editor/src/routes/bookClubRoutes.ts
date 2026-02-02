import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { bookClubImageUpload } from '../config/multer.js';
import {
  createBookClub,
  getBookClub,
  updateBookClub,
  getAllBookClubs,
  getMyBookClubs,
  uploadBookClubImage,
  deleteBookClubImage
} from '../controllers/bookClubController.js';

const router = Router();

// Create new bookclub
router.post('/', authMiddleware, createBookClub);

// Get all bookclubs (with optional filtering)
router.get('/', getAllBookClubs);

// Get my bookclubs
router.get('/my-bookclubs', authMiddleware, getMyBookClubs);

// Get bookclub by ID
router.get('/:bookClubId', getBookClub);

// Update bookclub
router.put('/:bookClubId', authMiddleware, updateBookClub);

// Upload bookclub image
router.post('/:bookClubId/image', authMiddleware, bookClubImageUpload.single('image'), uploadBookClubImage);

// Delete bookclub image
router.delete('/:bookClubId/image', authMiddleware, deleteBookClubImage);

export default router;
