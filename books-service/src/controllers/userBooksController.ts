import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../config/database';
import { GoogleBooksService } from '../../utils/googlebookapi';
import { addBookSchema, updateBookSchema } from '../../utils/validation';

/**
 * Get user's books (favorites, reading, etc.)
 */
export const getUserBooks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    const where: any = { userId: req.user!.userId };
    if (status) where.status = status;

    const userBooks = await prisma.userBook.findMany({
      where,
      include: { book: true },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ success: true, data: userBooks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Add book to user's library
 */
export const addUserBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = addBookSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { googleBooksId, status, rating, review } = value;

    // Fetch book from Google Books API
    const bookData = await GoogleBooksService.getBookById(googleBooksId);

    // Create or find book in our database
    const book = await prisma.book.upsert({
      where: { googleBooksId },
      update: {},
      create: bookData
    });

    // Add to user's library
    const userBook = await prisma.userBook.upsert({
      where: {
        userId_bookId: {
          userId: req.user!.userId,
          bookId: book.id
        }
      },
      update: { status, rating, review },
      create: {
        userId: req.user!.userId,
        bookId: book.id,
        status,
        rating,
        review
      },
      include: { book: true }
    });

    res.json({ success: true, data: userBook });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update user book status/rating
 */
export const updateUserBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = updateBookSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { bookId } = req.params;
    const { status, rating, review } = value;

    // Check if book exists in user's library
    const existingUserBook = await prisma.userBook.findUnique({
      where: {
        userId_bookId: {
          userId: req.user!.userId,
          bookId: bookId as string
        }
      }
    });

    if (!existingUserBook) {
      res.status(404).json({
        error: 'Book not found in your library. Please add it first.'
      });
      return;
    }

    // Build update data object with only provided fields
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (rating !== undefined) updateData.rating = rating;
    if (review !== undefined) updateData.review = review;

    const userBook = await prisma.userBook.update({
      where: {
        userId_bookId: {
          userId: req.user!.userId,
          bookId: bookId as string
        }
      },
      data: updateData,
      include: { book: true }
    });

    res.json({ success: true, data: userBook });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Remove book from user's library
 */
export const removeUserBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookId } = req.params;

    // Check if book exists in user's library
    const existingUserBook = await prisma.userBook.findUnique({
      where: {
        userId_bookId: {
          userId: req.user!.userId,
          bookId: bookId as string
        }
      }
    });

    if (!existingUserBook) {
      res.status(404).json({
        error: 'Book not found in your library'
      });
      return;
    }

    await prisma.userBook.delete({
      where: {
        userId_bookId: {
          userId: req.user!.userId,
          bookId: bookId as string
        }
      }
    });

    res.json({ success: true, message: 'Book removed from library' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Remove book from user's library (by userBookId)
 */
export const deleteUserBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userBookId } = req.params;

    // Check if book exists in user's library
    const existingUserBook = await prisma.userBook.findUnique({
      where: { id: userBookId as string }
    });

    if (!existingUserBook) {
      res.status(404).json({
        error: 'Book not found in your library'
      });
      return;
    }

    // Verify the book belongs to the requesting user
    if (existingUserBook.userId !== req.user!.userId) {
      res.status(403).json({
        error: 'You can only delete books from your own library'
      });
      return;
    }

    await prisma.userBook.delete({
      where: { id: userBookId as string }
    });

    res.json({ success: true, message: 'Book removed from library' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
