import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import {
  bookClubBookIdParamSchema,
  postsBookProgressSchema,
  bookClubBookReviewSchema,
} from '../utils/validation';
import * as progressController from '../controllers/readingProgressController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Reading progress routes
router.get(
  '/:bookClubBookId/progress',
  validate({ params: bookClubBookIdParamSchema }),
  progressController.getReadingProgress
);

router.post(
  '/:bookClubBookId/progress',
  validate({ params: bookClubBookIdParamSchema, body: postsBookProgressSchema }),
  progressController.updateReadingProgress
);

// Review routes
router.post(
  '/:bookClubBookId/review',
  validate({ params: bookClubBookIdParamSchema, body: bookClubBookReviewSchema }),
  progressController.addOrUpdateReview
);

router.get(
  '/:bookClubBookId/reviews',
  validate({ params: bookClubBookIdParamSchema }),
  progressController.getReviews
);

router.delete(
  '/:bookClubBookId/review',
  validate({ params: bookClubBookIdParamSchema }),
  progressController.deleteReview
);

export default router;
