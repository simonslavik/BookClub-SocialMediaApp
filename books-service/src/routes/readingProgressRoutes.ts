import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import * as progressController from '../controllers/readingProgressController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Reading progress routes
router.get('/:bookClubBookId/progress', progressController.getReadingProgress);
router.post('/:bookClubBookId/progress', progressController.updateReadingProgress);

// Review routes
router.post('/:bookClubBookId/review', progressController.addOrUpdateReview);
router.get('/:bookClubBookId/reviews', progressController.getReviews);
router.delete('/:bookClubBookId/review', progressController.deleteReview);

export default router;
