import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../config/database';
import {
  bookClubBookIdParamSchema,
  postsBookProgressSchema,
  bookClubBookReviewSchema
} from '../../utils/validation';

/**
 * Get user's reading progress for a bookclub book
 */
export const getReadingProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const paramValidation = bookClubBookIdParamSchema.validate(req.params);
    if (paramValidation.error) {
      res.status(400).json({ error: paramValidation.error.details[0].message });
      return;
    }

    const { bookClubBookId } = req.params;

    const existingBookClubBook = await prisma.bookClubBook.findUnique({
      where: { id: bookClubBookId as string }
    });

    if (!existingBookClubBook) {
      res.status(404).json({
        error: 'Book not found in bookclub'
      });
      return;
    }

    const progress = await prisma.readingProgress.findUnique({
      where: {
        bookClubBookId_userId: {
          bookClubBookId: bookClubBookId as string,
          userId: req.user!.userId
        }
      },
      include: {
        bookClubBook: {
          include: { book: true }
        }
      }
    });

    res.json({ success: true, data: progress });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update reading progress
 */
export const updateReadingProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const paramValidation = bookClubBookIdParamSchema.validate(req.params);
    if (paramValidation.error) {
      res.status(400).json({ error: paramValidation.error.details[0].message });
      return;
    }

    const bodyValidation = postsBookProgressSchema.validate(req.body);
    if (bodyValidation.error) {
      res.status(400).json({ error: bodyValidation.error.details[0].message });
      return;
    }

    const { bookClubBookId } = req.params;
    const { pagesRead, notes } = req.body;

    const bookClubBook = await prisma.bookClubBook.findUnique({
      where: { id: bookClubBookId as string },
      include: { book: true }
    });

    if (!bookClubBook) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    const totalPages = bookClubBook.book.pageCount || 100;
    const percentage = Math.min(Math.round((pagesRead / totalPages) * 100), 100);

    const progress = await prisma.readingProgress.upsert({
      where: {
        bookClubBookId_userId: {
          bookClubBookId: bookClubBookId as string,
          userId: req.user!.userId
        }
      },
      update: {
        pagesRead,
        percentage,
        notes,
        lastReadDate: new Date()
      },
      create: {
        bookClubBookId: bookClubBookId as string,
        userId: req.user!.userId,
        pagesRead,
        percentage,
        notes
      }
    });

    res.json({ success: true, data: progress });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Add or update review for a bookclub book
 */
export const addOrUpdateReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const paramValidation = bookClubBookIdParamSchema.validate(req.params);
    if (paramValidation.error) {
      res.status(400).json({ error: paramValidation.error.details[0].message });
      return;
    }

    const bodyValidation = bookClubBookReviewSchema.validate(req.body);
    if (bodyValidation.error) {
      res.status(400).json({ error: bodyValidation.error.details[0].message });
      return;
    }

    const { bookClubBookId } = req.params;
    const { rating, reviewText } = req.body;

    const bookClubBook = await prisma.bookClubBook.findUnique({
      where: { id: bookClubBookId as string }
    });

    if (!bookClubBook) {
      res.status(404).json({ error: 'Book not found in bookclub' });
      return;
    }

    const review = await prisma.bookClubBookReview.upsert({
      where: {
        bookClubBookId_userId: {
          bookClubBookId: bookClubBookId as string,
          userId: req.user!.userId
        }
      },
      update: {
        rating,
        reviewText: reviewText || null
      },
      create: {
        bookClubBookId: bookClubBookId as string,
        userId: req.user!.userId,
        rating,
        reviewText: reviewText || null
      }
    });

    res.json({ success: true, data: review });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all reviews for a bookclub book
 */
export const getReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const paramValidation = bookClubBookIdParamSchema.validate(req.params);
    if (paramValidation.error) {
      res.status(400).json({ error: paramValidation.error.details[0].message });
      return;
    }

    const { bookClubBookId } = req.params;

    const reviews = await prisma.bookClubBookReview.findMany({
      where: { bookClubBookId: bookClubBookId as string },
      orderBy: { createdAt: 'desc' }
    });

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({
      success: true,
      data: {
        reviews,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete user's review
 */
export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const paramValidation = bookClubBookIdParamSchema.validate(req.params);
    if (paramValidation.error) {
      res.status(400).json({ error: paramValidation.error.details[0].message });
      return;
    }

    const { bookClubBookId } = req.params;

    await prisma.bookClubBookReview.delete({
      where: {
        bookClubBookId_userId: {
          bookClubBookId: bookClubBookId as string,
          userId: req.user!.userId
        }
      }
    });

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    res.status(500).json({ error: error.message });
  }
};
