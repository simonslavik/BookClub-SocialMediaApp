import { UserBooksService } from '../../../src/services/userBooks.service';
import { UserBooksRepository } from '../../../src/repositories/userBooks.repository';
import { BooksRepository } from '../../../src/repositories/books.repository';
import { GoogleBooksService } from '../../../src/services/googleBooks.service';
import { NotFoundError, ForbiddenError } from '../../../src/utils/errors';

jest.mock('../../../src/repositories/userBooks.repository');
jest.mock('../../../src/repositories/books.repository');
jest.mock('../../../src/services/googleBooks.service');
jest.mock('../../../src/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('UserBooksService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getUserBooks', () => {
    it('should return paginated results', async () => {
      const data = [{ id: '1', status: 'reading' }];
      (UserBooksRepository.findByUserId as jest.Mock).mockResolvedValue({ data, total: 1 });

      const result = await UserBooksService.getUserBooks('user-1', undefined, 1, 20);

      expect(UserBooksRepository.findByUserId).toHaveBeenCalledWith('user-1', undefined, 0, 20);
      expect(result).toEqual({
        data,
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });
    });

    it('should calculate skip from page and limit', async () => {
      (UserBooksRepository.findByUserId as jest.Mock).mockResolvedValue({ data: [], total: 0 });

      await UserBooksService.getUserBooks('user-1', undefined, 3, 10);

      expect(UserBooksRepository.findByUserId).toHaveBeenCalledWith('user-1', undefined, 20, 10);
    });

    it('should pass status filter', async () => {
      (UserBooksRepository.findByUserId as jest.Mock).mockResolvedValue({ data: [], total: 0 });

      await UserBooksService.getUserBooks('user-1', 'reading' as any, 1, 20);

      expect(UserBooksRepository.findByUserId).toHaveBeenCalledWith('user-1', 'reading', 0, 20);
    });

    it('should calculate totalPages correctly', async () => {
      (UserBooksRepository.findByUserId as jest.Mock).mockResolvedValue({ data: [], total: 25 });

      const result = await UserBooksService.getUserBooks('user-1', undefined, 1, 10);

      expect(result.pagination.totalPages).toBe(3);
    });
  });

  describe('addUserBook', () => {
    it('should fetch book data, upsert book, then upsert user book', async () => {
      const bookData = { googleBooksId: 'g1', title: 'Test' };
      const book = { id: 'b-1', ...bookData };
      const userBook = { id: 'ub-1', userId: 'user-1', bookId: 'b-1', status: 'reading' };

      (GoogleBooksService.getBookById as jest.Mock).mockResolvedValue(bookData);
      (BooksRepository.upsert as jest.Mock).mockResolvedValue(book);
      (UserBooksRepository.upsert as jest.Mock).mockResolvedValue(userBook);

      const result = await UserBooksService.addUserBook('user-1', 'g1', 'reading' as any, 4, 'Good');

      expect(GoogleBooksService.getBookById).toHaveBeenCalledWith('g1');
      expect(BooksRepository.upsert).toHaveBeenCalledWith('g1', bookData);
      expect(UserBooksRepository.upsert).toHaveBeenCalledWith('user-1', 'b-1', {
        status: 'reading',
        rating: 4,
        review: 'Good',
      });
      expect(result).toEqual(userBook);
    });

    it('should propagate Google Books API errors', async () => {
      (GoogleBooksService.getBookById as jest.Mock).mockRejectedValue(new Error('API fail'));

      await expect(UserBooksService.addUserBook('user-1', 'g1', 'reading' as any)).rejects.toThrow('API fail');
    });
  });

  describe('updateUserBook', () => {
    it('should update when book exists', async () => {
      const existing = { id: 'ub-1', userId: 'user-1', bookId: 'b-1' };
      const updated = { ...existing, status: 'completed' };

      (UserBooksRepository.findOne as jest.Mock).mockResolvedValue(existing);
      (UserBooksRepository.update as jest.Mock).mockResolvedValue(updated);

      const result = await UserBooksService.updateUserBook('user-1', 'b-1', { status: 'completed' as any });

      expect(UserBooksRepository.findOne).toHaveBeenCalledWith('user-1', 'b-1');
      expect(UserBooksRepository.update).toHaveBeenCalledWith('user-1', 'b-1', { status: 'completed' });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundError when book does not exist', async () => {
      (UserBooksRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        UserBooksService.updateUserBook('user-1', 'b-1', { status: 'completed' as any })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteUserBook', () => {
    it('should delete when book exists', async () => {
      (UserBooksRepository.findOne as jest.Mock).mockResolvedValue({ id: 'ub-1' });
      (UserBooksRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await UserBooksService.deleteUserBook('user-1', 'b-1');

      expect(UserBooksRepository.delete).toHaveBeenCalledWith('user-1', 'b-1');
    });

    it('should throw NotFoundError when book does not exist', async () => {
      (UserBooksRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(UserBooksService.deleteUserBook('user-1', 'b-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteUserBookById', () => {
    it('should delete when book belongs to user', async () => {
      (UserBooksRepository.findById as jest.Mock).mockResolvedValue({ id: 'ub-1', userId: 'user-1' });
      (UserBooksRepository.deleteById as jest.Mock).mockResolvedValue(undefined);

      await UserBooksService.deleteUserBookById('user-1', 'ub-1');

      expect(UserBooksRepository.deleteById).toHaveBeenCalledWith('ub-1');
    });

    it('should throw NotFoundError when not found', async () => {
      (UserBooksRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(UserBooksService.deleteUserBookById('user-1', 'ub-1')).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when book belongs to another user', async () => {
      (UserBooksRepository.findById as jest.Mock).mockResolvedValue({ id: 'ub-1', userId: 'other-user' });

      await expect(UserBooksService.deleteUserBookById('user-1', 'ub-1')).rejects.toThrow(ForbiddenError);
    });
  });
});
