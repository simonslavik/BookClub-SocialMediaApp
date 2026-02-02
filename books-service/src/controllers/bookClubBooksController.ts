import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../config/database';
import { GoogleBooksService } from '../../utils/googlebookapi';
import {
  bookClubIdParamSchema,
  bookIdParamSchema,
  addBookForBookClubSchema,
  updateBookClubBookSchema
} from '../../utils/validation';

/**
 * Get books for a bookclub
 */
export const getBookClubBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookClubId } = req.params;
    const { status } = req.query;

    const where: any = { bookClubId };
    if (status) where.status = status;

    const books = await prisma.bookClubBook.findMany({
      where,
      include: {
        book: true,
        readingProgress: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: books });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Add book to bookclub
 */
export const addBookClubBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const paramValidation = bookClubIdParamSchema.validate(req.params);
    if (paramValidation.error) {
      res.status(400).json({ error: paramValidation.error.details[0].message });
      return;
    }

    const bodyValidation = addBookForBookClubSchema.validate(req.body);
    if (bodyValidation.error) {
      res.status(400).json({ error: bodyValidation.error.details[0].message });
      return;
    }

    const { bookClubId } = req.params;
    const { googleBooksId, status = 'upcoming', startDate, endDate } = req.body;

    const bookData = await GoogleBooksService.getBookById(googleBooksId);
    const book = await prisma.book.upsert({
      where: { googleBooksId },
      update: {},
      create: bookData
    });

    const bookClubBook = await prisma.bookClubBook.create({
      data: {
        bookClubId: bookClubId as string,
        bookId: book.id,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        addedById: req.user!.userId
      },
      include: { book: true }
    });

    res.json({ success: true, data: bookClubBook });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update bookclub book status
 */
export const updateBookClubBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const paramValidation = bookClubIdParamSchema.validate({ bookClubId: req.params.bookClubId });
    if (paramValidation.error) {
      res.status(400).json({ error: paramValidation.error.details[0].message });
      return;
    }

    const bookIdValidation = bookIdParamSchema.validate({ bookId: req.params.bookId });
    if (bookIdValidation.error) {
      res.status(400).json({ error: bookIdValidation.error.details[0].message });
      return;
    }

    const bodyValidation = updateBookClubBookSchema.validate(req.body);
    if (bodyValidation.error) {
      res.status(400).json({ error: bodyValidation.error.details[0].message });
      return;
    }

    const { bookClubId, bookId } = req.params;
    const { status, startDate, endDate } = req.body;

    const existingBookClubBook = await prisma.bookClubBook.findUnique({
      where: { bookClubId_bookId: { bookClubId: bookClubId as string, bookId: bookId as string } }
    });

    if (!existingBookClubBook) {
      res.status(404).json({
        error: 'Book not found in this bookclub. Please add it first.'
      });
      return;
    }

    const bookClubBook = await prisma.bookClubBook.update({
      where: { bookClubId_bookId: { bookClubId: bookClubId as string, bookId: bookId as string } },
      data: {
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      },
      include: { book: true }
    });

    res.json({ success: true, data: bookClubBook });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete book from bookclub
 */
export const deleteBookClubBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const paramValidation = bookClubIdParamSchema.validate({ bookClubId: req.params.bookClubId });
    if (paramValidation.error) {
      res.status(400).json({ error: paramValidation.error.details[0].message });
      return;
    }

    const bookIdValidation = bookIdParamSchema.validate({ bookId: req.params.bookId });
    if (bookIdValidation.error) {
      res.status(400).json({ error: bookIdValidation.error.details[0].message });
      return;
    }

    const { bookClubId, bookId } = req.params;

    const existingBookClubBook = await prisma.bookClubBook.findUnique({
      where: { bookClubId_bookId: { bookClubId: bookClubId as string, bookId: bookId as string } }
    });

    if (!existingBookClubBook) {
      res.status(404).json({
        error: 'Book not found in this bookclub'
      });
      return;
    }

    await prisma.bookClubBook.delete({
      where: { bookClubId_bookId: { bookClubId: bookClubId as string, bookId: bookId as string } }
    });

    res.json({ success: true, message: 'Book removed from bookclub' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
