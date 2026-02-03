import { BookClubBooksRepository } from '../repositories/bookClubBooks.repository';
import { BooksRepository } from '../repositories/books.repository';
import { GoogleBooksService } from './googleBooks.service';
import logger from '../utils/logger';

export class BookClubBooksService {
  /**
   * Get books for a bookclub
   */
  static async getBookClubBooks(bookClubId: string, status?: string) {
    try {
      return await BookClubBooksRepository.findByBookClubId(bookClubId, status);
    } catch (error: any) {
      logger.error('Error fetching bookclub books:', { error: error.message, bookClubId, status });
      throw error;
    }
  }

  /**
   * Add book to bookclub
   */
  static async addBookClubBook(
    bookClubId: string,
    userId: string,
    googleBooksId: string,
    status: string = 'upcoming',
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      // Fetch book data from Google Books API
      const bookData = await GoogleBooksService.getBookById(googleBooksId);

      // Create or find book in database
      const book = await BooksRepository.upsert(googleBooksId, bookData);

      // Add to bookclub
      const bookClubBook = await BookClubBooksRepository.create({
        bookClubId,
        bookId: book.id,
        status,
        startDate: startDate || null,
        endDate: endDate || null,
        addedById: userId
      });

      logger.info('Book added to bookclub:', { bookClubId, bookId: book.id, status });
      return bookClubBook;
    } catch (error: any) {
      logger.error('Error adding bookclub book:', { error: error.message, bookClubId, googleBooksId });
      throw error;
    }
  }

  /**
   * Update bookclub book
   */
  static async updateBookClubBook(
    bookClubId: string,
    bookId: string,
    data: { status?: string; startDate?: Date; endDate?: Date }
  ) {
    try {
      // Check if book exists in bookclub
      const existingBookClubBook = await BookClubBooksRepository.findOne(bookClubId, bookId);
      
      if (!existingBookClubBook) {
        throw new Error('Book not found in this bookclub. Please add it first.');
      }

      const updatedData: any = {};
      if (data.status) updatedData.status = data.status;
      if (data.startDate) updatedData.startDate = data.startDate;
      if (data.endDate) updatedData.endDate = data.endDate;

      const updatedBook = await BookClubBooksRepository.update(bookClubId, bookId, updatedData);
      
      logger.info('Bookclub book updated:', { bookClubId, bookId });
      return updatedBook;
    } catch (error: any) {
      logger.error('Error updating bookclub book:', { error: error.message, bookClubId, bookId });
      throw error;
    }
  }

  /**
   * Delete book from bookclub
   */
  static async deleteBookClubBook(bookClubId: string, bookId: string) {
    try {
      // Check if book exists in bookclub
      const existingBookClubBook = await BookClubBooksRepository.findOne(bookClubId, bookId);
      
      if (!existingBookClubBook) {
        throw new Error('Book not found in this bookclub');
      }

      await BookClubBooksRepository.delete(bookClubId, bookId);
      
      logger.info('Bookclub book deleted:', { bookClubId, bookId });
    } catch (error: any) {
      logger.error('Error deleting bookclub book:', { error: error.message, bookClubId, bookId });
      throw error;
    }
  }

  /**
   * Get current books for multiple bookclubs (batch operation)
   */
  static async getBatchCurrentBooks(bookClubIds: string[]) {
    try {
      const results = await Promise.all(
        bookClubIds.map(async (bookClubId) => {
          const books = await BookClubBooksRepository.findByBookClubId(bookClubId, 'current');
          return {
            bookClubId,
            currentBook: books.length > 0 ? books[0] : null
          };
        })
      );
      
      return results;
    } catch (error: any) {
      logger.error('Error fetching batch current books:', { error: error.message });
      throw error;
    }
  }
}
