import { UserBooksRepository } from '../repositories/userBooks.repository';
import { BooksRepository } from '../repositories/books.repository';
import { GoogleBooksService } from './googleBooks.service';
import { UserBookStatus } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import logger from '../utils/logger';

export class UserBooksService {
  /**
   * Get user's books with optional status filter (with pagination)
   */
  static async getUserBooks(userId: string, status?: UserBookStatus, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const { data, total } = await UserBooksRepository.findByUserId(userId, status, skip, limit);
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Add book to user's library
   */
  static async addUserBook(
    userId: string,
    googleBooksId: string,
    status: UserBookStatus,
    rating?: number,
    review?: string
  ) {
    // Fetch book data from Google Books API
    const bookData = await GoogleBooksService.getBookById(googleBooksId);

    // Create or find book in database
    const book = await BooksRepository.upsert(googleBooksId, bookData);

    // Add to user's library
    const userBook = await UserBooksRepository.upsert(userId, book.id, {
      status,
      rating,
      review,
    });

    logger.info('Book added to user library:', { userId, bookId: book.id, status });
    return userBook;
  }

  /**
   * Update user book
   */
  static async updateUserBook(
    userId: string,
    bookId: string,
    data: { status?: UserBookStatus; rating?: number; review?: string }
  ) {
    const existingUserBook = await UserBooksRepository.findOne(userId, bookId);
    if (!existingUserBook) {
      throw new NotFoundError('Book in your library');
    }

    const updatedBook = await UserBooksRepository.update(userId, bookId, data);
    logger.info('User book updated:', { userId, bookId });
    return updatedBook;
  }

  /**
   * Delete book from user's library (by composite key)
   */
  static async deleteUserBook(userId: string, bookId: string) {
    const existingUserBook = await UserBooksRepository.findOne(userId, bookId);
    if (!existingUserBook) {
      throw new NotFoundError('Book in your library');
    }

    await UserBooksRepository.delete(userId, bookId);
    logger.info('User book deleted:', { userId, bookId });
  }

  /**
   * Delete user book by its primary key (id), with ownership check
   */
  static async deleteUserBookById(userId: string, userBookId: string) {
    const existingUserBook = await UserBooksRepository.findById(userBookId);
    if (!existingUserBook) {
      throw new NotFoundError('Book in your library');
    }

    if (existingUserBook.userId !== userId) {
      throw new ForbiddenError('You can only delete books from your own library');
    }

    await UserBooksRepository.deleteById(userBookId);
    logger.info('User book deleted by id:', { userId, userBookId });
  }
}
