import { Request, Response, NextFunction } from 'express';
import {
  getBookClubBooks,
  addBookClubBook,
  updateBookClubBook,
  deleteBookClubBook,
  getBatchCurrentBooks,
} from '../../../src/controllers/bookClubBooksController';
import { BookClubBooksService } from '../../../src/services/bookClubBooks.service';
import { AuthRequest } from '../../../src/middleware/authMiddleware';

jest.mock('../../../src/services/bookClubBooks.service');

describe('BookClubBooksController', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    mockNext = jest.fn();
    mockReq = {
      user: { userId: 'user-1', email: 'test@test.com', role: 'user' },
      query: {},
      params: { bookClubId: 'bc-1' },
      body: {},
    };
    mockRes = { json: jsonMock } as Partial<Response>;
    jest.clearAllMocks();
  });

  describe('getBookClubBooks', () => {
    it('should return paginated bookclub books', async () => {
      const result = {
        data: [{ id: '1' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      (BookClubBooksService.getBookClubBooks as jest.Mock).mockResolvedValue(result);

      await getBookClubBooks(mockReq as Request, mockRes as Response, mockNext);

      expect(BookClubBooksService.getBookClubBooks).toHaveBeenCalledWith('bc-1', undefined, 1, 20);
      expect(jsonMock).toHaveBeenCalledWith({ success: true, ...result });
    });

    it('should pass status filter and pagination params', async () => {
      mockReq.query = { status: 'current', page: '2', limit: '10' };
      (BookClubBooksService.getBookClubBooks as jest.Mock).mockResolvedValue({ data: [], pagination: {} });

      await getBookClubBooks(mockReq as Request, mockRes as Response, mockNext);

      expect(BookClubBooksService.getBookClubBooks).toHaveBeenCalledWith('bc-1', 'current', 2, 10);
    });

    it('should call next(error) on failure', async () => {
      const error = new Error('fail');
      (BookClubBooksService.getBookClubBooks as jest.Mock).mockRejectedValue(error);

      await getBookClubBooks(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('addBookClubBook', () => {
    it('should add book to bookclub', async () => {
      mockReq.body = { googleBooksId: 'g1', status: 'current', startDate: '2025-01-01', endDate: '2025-02-01' };
      const bookClubBook = { id: 'bcb-1', status: 'current' };
      (BookClubBooksService.addBookClubBook as jest.Mock).mockResolvedValue(bookClubBook);

      await addBookClubBook(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(BookClubBooksService.addBookClubBook).toHaveBeenCalledWith(
        'bc-1', 'user-1', 'g1', 'current',
        new Date('2025-01-01'), new Date('2025-02-01')
      );
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: bookClubBook });
    });

    it('should default status to upcoming', async () => {
      mockReq.body = { googleBooksId: 'g1' };
      (BookClubBooksService.addBookClubBook as jest.Mock).mockResolvedValue({});

      await addBookClubBook(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(BookClubBooksService.addBookClubBook).toHaveBeenCalledWith(
        'bc-1', 'user-1', 'g1', 'upcoming', undefined, undefined
      );
    });

    it('should call next(error) on failure', async () => {
      mockReq.body = { googleBooksId: 'g1' };
      const error = new Error('fail');
      (BookClubBooksService.addBookClubBook as jest.Mock).mockRejectedValue(error);

      await addBookClubBook(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateBookClubBook', () => {
    it('should update bookclub book', async () => {
      mockReq.params = { bookClubId: 'bc-1', bookId: 'b-1' };
      mockReq.body = { status: 'completed' };
      const updated = { id: 'bcb-1', status: 'completed' };
      (BookClubBooksService.updateBookClubBook as jest.Mock).mockResolvedValue(updated);

      await updateBookClubBook(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(BookClubBooksService.updateBookClubBook).toHaveBeenCalledWith('bc-1', 'b-1', {
        status: 'completed',
        startDate: undefined,
        endDate: undefined,
      });
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: updated });
    });

    it('should call next(error) on failure', async () => {
      mockReq.params = { bookClubId: 'bc-1', bookId: 'b-1' };
      mockReq.body = { status: 'completed' };
      const error = new Error('not found');
      (BookClubBooksService.updateBookClubBook as jest.Mock).mockRejectedValue(error);

      await updateBookClubBook(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteBookClubBook', () => {
    it('should delete and return success message', async () => {
      mockReq.params = { bookClubId: 'bc-1', bookId: 'b-1' };
      (BookClubBooksService.deleteBookClubBook as jest.Mock).mockResolvedValue(undefined);

      await deleteBookClubBook(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(BookClubBooksService.deleteBookClubBook).toHaveBeenCalledWith('bc-1', 'b-1');
      expect(jsonMock).toHaveBeenCalledWith({ success: true, message: 'Book removed from bookclub' });
    });

    it('should call next(error) on failure', async () => {
      mockReq.params = { bookClubId: 'bc-1', bookId: 'b-1' };
      const error = new Error('not found');
      (BookClubBooksService.deleteBookClubBook as jest.Mock).mockRejectedValue(error);

      await deleteBookClubBook(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getBatchCurrentBooks', () => {
    it('should return current books for multiple bookclubs', async () => {
      mockReq.body = { bookClubIds: ['bc-1', 'bc-2'] };
      const currentBooks = [
        { bookClubId: 'bc-1', currentBook: { id: 'bcb-1' } },
        { bookClubId: 'bc-2', currentBook: null },
      ];
      (BookClubBooksService.getBatchCurrentBooks as jest.Mock).mockResolvedValue(currentBooks);

      await getBatchCurrentBooks(mockReq as Request, mockRes as Response, mockNext);

      expect(BookClubBooksService.getBatchCurrentBooks).toHaveBeenCalledWith(['bc-1', 'bc-2']);
      expect(jsonMock).toHaveBeenCalledWith({ success: true, currentBooks });
    });

    it('should call next(error) on failure', async () => {
      mockReq.body = { bookClubIds: ['bc-1'] };
      const error = new Error('fail');
      (BookClubBooksService.getBatchCurrentBooks as jest.Mock).mockRejectedValue(error);

      await getBatchCurrentBooks(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
