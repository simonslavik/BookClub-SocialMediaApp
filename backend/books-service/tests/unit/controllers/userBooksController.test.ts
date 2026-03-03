import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../src/middleware/authMiddleware';
import {
  getUserBooks,
  addUserBook,
  updateUserBook,
  deleteUserBook,
} from '../../../src/controllers/userBooksController';
import { UserBooksService } from '../../../src/services/userBooks.service';

jest.mock('../../../src/services/userBooks.service');

describe('UserBooksController', () => {
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
      params: {},
      body: {},
    };

    mockRes = { json: jsonMock } as Partial<Response>;

    jest.clearAllMocks();
  });

  describe('getUserBooks', () => {
    it('should return paginated user books', async () => {
      const result = {
        data: [{ id: '1', status: 'reading' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      (UserBooksService.getUserBooks as jest.Mock).mockResolvedValue(result);

      await getUserBooks(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(UserBooksService.getUserBooks).toHaveBeenCalledWith('user-1', undefined, 1, 20);
      expect(jsonMock).toHaveBeenCalledWith({ success: true, ...result });
    });

    it('should pass status filter and pagination', async () => {
      mockReq.query = { status: 'reading', page: '3', limit: '5' };
      (UserBooksService.getUserBooks as jest.Mock).mockResolvedValue({ data: [], pagination: {} });

      await getUserBooks(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(UserBooksService.getUserBooks).toHaveBeenCalledWith('user-1', 'reading', 3, 5);
    });

    it('should call next(error) on failure', async () => {
      const error = new Error('fail');
      (UserBooksService.getUserBooks as jest.Mock).mockRejectedValue(error);

      await getUserBooks(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });

  describe('addUserBook', () => {
    it('should add a book and return success', async () => {
      mockReq.body = { googleBooksId: 'g1', status: 'reading', rating: 4, review: 'good' };
      const userBook = { id: 'ub-1', status: 'reading', rating: 4 };
      (UserBooksService.addUserBook as jest.Mock).mockResolvedValue(userBook);

      await addUserBook(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(UserBooksService.addUserBook).toHaveBeenCalledWith('user-1', 'g1', 'reading', 4, 'good');
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: userBook });
    });

    it('should call next(error) on failure', async () => {
      mockReq.body = { googleBooksId: 'g1', status: 'reading' };
      const error = new Error('API error');
      (UserBooksService.addUserBook as jest.Mock).mockRejectedValue(error);

      await addUserBook(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateUserBook', () => {
    it('should update and return success', async () => {
      mockReq.params = { bookId: 'b1' };
      mockReq.body = { status: 'completed', rating: 5 };
      const updated = { id: 'ub-1', status: 'completed', rating: 5 };
      (UserBooksService.updateUserBook as jest.Mock).mockResolvedValue(updated);

      await updateUserBook(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(UserBooksService.updateUserBook).toHaveBeenCalledWith('user-1', 'b1', {
        status: 'completed',
        rating: 5,
        review: undefined,
      });
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: updated });
    });

    it('should call next(error) on failure', async () => {
      mockReq.params = { bookId: 'b1' };
      mockReq.body = { status: 'completed' };
      const error = new Error('not found');
      (UserBooksService.updateUserBook as jest.Mock).mockRejectedValue(error);

      await updateUserBook(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteUserBook', () => {
    it('should delete and return success message', async () => {
      mockReq.params = { userBookId: 'ub-1' };
      (UserBooksService.deleteUserBookById as jest.Mock).mockResolvedValue(undefined);

      await deleteUserBook(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(UserBooksService.deleteUserBookById).toHaveBeenCalledWith('user-1', 'ub-1');
      expect(jsonMock).toHaveBeenCalledWith({ success: true, message: 'Book removed from library' });
    });

    it('should call next(error) on failure', async () => {
      mockReq.params = { userBookId: 'ub-1' };
      const error = new Error('not found');
      (UserBooksService.deleteUserBookById as jest.Mock).mockRejectedValue(error);

      await deleteUserBook(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
