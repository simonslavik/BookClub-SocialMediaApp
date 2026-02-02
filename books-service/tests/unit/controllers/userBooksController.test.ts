import { Response } from 'express';
import { AuthRequest } from '../../../src/middleware/authMiddleware';
import {
  getUserBooks,
  addUserBook,
  updateUserBook,
  removeUserBook
} from '../../../src/controllers/userBooksController';
import prisma from '../../../src/config/database';
import { GoogleBooksService } from '../../../utils/googlebookapi';

// Mock dependencies
jest.mock('../../../src/config/database', () => ({
  __esModule: true,
  default: {
    userBook: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    book: {
      upsert: jest.fn()
    }
  }
}));

jest.mock('../../../utils/googlebookapi');

describe('UserBooksController', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      user: { 
        userId: 'test-user-123', 
        email: 'test@example.com',
        role: 'user',
        name: 'Test User'
      },
      query: {},
      params: {},
      body: {}
    };

    mockRes = {
      json: jsonMock,
      status: statusMock
    };

    jest.clearAllMocks();
  });

  describe('getUserBooks', () => {
    it('should return all user books when no status filter', async () => {
      const mockBooks = [
        {
          id: '1',
          userId: 'test-user-123',
          bookId: 'book-1',
          status: 'reading',
          book: { id: 'book-1', title: 'Test Book' }
        }
      ];

      (prisma.userBook.findMany as jest.Mock).mockResolvedValue(mockBooks);

      await getUserBooks(mockReq as AuthRequest, mockRes as Response);

      expect(prisma.userBook.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-123' },
        include: { book: true },
        orderBy: { updatedAt: 'desc' }
      });

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockBooks
      });
    });

    it('should filter books by status', async () => {
      mockReq.query = { status: 'reading' };

      const mockBooks = [
        {
          id: '1',
          userId: 'test-user-123',
          bookId: 'book-1',
          status: 'reading',
          book: { id: 'book-1', title: 'Test Book' }
        }
      ];

      (prisma.userBook.findMany as jest.Mock).mockResolvedValue(mockBooks);

      await getUserBooks(mockReq as AuthRequest, mockRes as Response);

      expect(prisma.userBook.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-123', status: 'reading' },
        include: { book: true },
        orderBy: { updatedAt: 'desc' }
      });
    });

    it('should handle errors', async () => {
      (prisma.userBook.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await getUserBooks(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Database error'
      });
    });
  });

  describe('addUserBook', () => {
    it('should add a book to user library', async () => {
      mockReq.body = {
        googleBooksId: 'abc123',
        status: 'reading',
        rating: 4,
        review: 'Great book'
      };

      const mockGoogleBook = {
        googleBooksId: 'abc123',
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test description',
        coverUrl: 'http://example.com/cover.jpg',
        pageCount: 300,
        publishedDate: '2020-01-01',
        isbn: '1234567890'
      };

      const mockBook = {
        id: 'book-1',
        ...mockGoogleBook
      };

      const mockUserBook = {
        id: 'user-book-1',
        userId: 'test-user-123',
        bookId: 'book-1',
        status: 'reading',
        rating: 4,
        review: 'Great book',
        book: mockBook
      };

      (GoogleBooksService.getBookById as jest.Mock).mockResolvedValue(mockGoogleBook);
      (prisma.book.upsert as jest.Mock).mockResolvedValue(mockBook);
      (prisma.userBook.upsert as jest.Mock).mockResolvedValue(mockUserBook);

      await addUserBook(mockReq as AuthRequest, mockRes as Response);

      expect(GoogleBooksService.getBookById).toHaveBeenCalledWith('abc123');
      expect(prisma.book.upsert).toHaveBeenCalled();
      expect(prisma.userBook.upsert).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockUserBook
      });
    });

    it('should return 400 for invalid data', async () => {
      mockReq.body = {
        googleBooksId: 'abc123',
        status: 'invalid_status'
      };

      await addUserBook(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      );
    });

    it('should handle Google Books API errors', async () => {
      mockReq.body = {
        googleBooksId: 'abc123',
        status: 'reading'
      };

      (GoogleBooksService.getBookById as jest.Mock).mockRejectedValue(
        new Error('Book not found')
      );

      await addUserBook(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Book not found'
      });
    });
  });

  describe('updateUserBook', () => {
    it('should update user book status', async () => {
      mockReq.params = { bookId: 'book-1' };
      mockReq.body = {
        status: 'completed',
        rating: 5
      };

      const existingBook = {
        id: 'user-book-1',
        userId: 'test-user-123',
        bookId: 'book-1',
        status: 'reading'
      };

      const updatedBook = {
        ...existingBook,
        status: 'completed',
        rating: 5
      };

      (prisma.userBook.findUnique as jest.Mock).mockResolvedValue(existingBook);
      (prisma.userBook.update as jest.Mock).mockResolvedValue(updatedBook);

      await updateUserBook(mockReq as AuthRequest, mockRes as Response);

      expect(prisma.userBook.findUnique).toHaveBeenCalledWith({
        where: {
          userId_bookId: {
            userId: 'test-user-123',
            bookId: 'book-1'
          }
        }
      });

      expect(prisma.userBook.update).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: updatedBook
      });
    });

    it('should return 404 if book not found in user library', async () => {
      mockReq.params = { bookId: 'book-1' };
      mockReq.body = { status: 'completed' };

      (prisma.userBook.findUnique as jest.Mock).mockResolvedValue(null);

      await updateUserBook(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Book not found in your library'
      });
    });

    it('should validate update data', async () => {
      mockReq.params = { bookId: 'book-1' };
      mockReq.body = { rating: 10 }; // Invalid rating

      await updateUserBook(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('removeUserBook', () => {
    it('should remove book from user library', async () => {
      mockReq.params = { bookId: 'book-1' };

      const existingBook = {
        id: 'user-book-1',
        userId: 'test-user-123',
        bookId: 'book-1'
      };

      (prisma.userBook.findUnique as jest.Mock).mockResolvedValue(existingBook);
      (prisma.userBook.delete as jest.Mock).mockResolvedValue(existingBook);

      await removeUserBook(mockReq as AuthRequest, mockRes as Response);

      expect(prisma.userBook.delete).toHaveBeenCalledWith({
        where: {
          userId_bookId: {
            userId: 'test-user-123',
            bookId: 'book-1'
          }
        }
      });

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Book removed from library'
      });
    });

    it('should return 404 if book not in library', async () => {
      mockReq.params = { bookId: 'book-1' };

      (prisma.userBook.findUnique as jest.Mock).mockResolvedValue(null);

      await removeUserBook(mockReq as AuthRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Book not found in your library'
      });
    });
  });
});
