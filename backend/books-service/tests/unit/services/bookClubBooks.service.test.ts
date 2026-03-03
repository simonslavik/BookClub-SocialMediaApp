import { BookClubBooksService } from '../../../src/services/bookClubBooks.service';
import { BookClubBooksRepository } from '../../../src/repositories/bookClubBooks.repository';
import { BooksRepository } from '../../../src/repositories/books.repository';
import { GoogleBooksService } from '../../../src/services/googleBooks.service';
import { NotFoundError } from '../../../src/utils/errors';

jest.mock('../../../src/repositories/bookClubBooks.repository');
jest.mock('../../../src/repositories/books.repository');
jest.mock('../../../src/services/googleBooks.service');
jest.mock('../../../src/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('BookClubBooksService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getBookClubBooks', () => {
    it('should return paginated results', async () => {
      const data = [{ id: 'bcb-1' }];
      (BookClubBooksRepository.findByBookClubId as jest.Mock).mockResolvedValue({ data, total: 1 });

      const result = await BookClubBooksService.getBookClubBooks('bc-1', undefined, 1, 20);

      expect(BookClubBooksRepository.findByBookClubId).toHaveBeenCalledWith('bc-1', undefined, 0, 20);
      expect(result).toEqual({
        data,
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });
    });

    it('should calculate skip and totalPages correctly', async () => {
      (BookClubBooksRepository.findByBookClubId as jest.Mock).mockResolvedValue({ data: [], total: 45 });

      const result = await BookClubBooksService.getBookClubBooks('bc-1', undefined, 3, 10);

      expect(BookClubBooksRepository.findByBookClubId).toHaveBeenCalledWith('bc-1', undefined, 20, 10);
      expect(result.pagination.totalPages).toBe(5);
    });

    it('should pass status filter', async () => {
      (BookClubBooksRepository.findByBookClubId as jest.Mock).mockResolvedValue({ data: [], total: 0 });

      await BookClubBooksService.getBookClubBooks('bc-1', 'current' as any);

      expect(BookClubBooksRepository.findByBookClubId).toHaveBeenCalledWith('bc-1', 'current', 0, 20);
    });
  });

  describe('addBookClubBook', () => {
    it('should fetch book data, upsert book, and create bookclub book', async () => {
      const bookData = { googleBooksId: 'g1', title: 'Test' };
      const book = { id: 'b-1', ...bookData };
      const bookClubBook = { id: 'bcb-1', bookClubId: 'bc-1' };

      (GoogleBooksService.getBookById as jest.Mock).mockResolvedValue(bookData);
      (BooksRepository.upsert as jest.Mock).mockResolvedValue(book);
      (BookClubBooksRepository.create as jest.Mock).mockResolvedValue(bookClubBook);

      const result = await BookClubBooksService.addBookClubBook(
        'bc-1', 'user-1', 'g1', 'current' as any,
        new Date('2025-01-01'), new Date('2025-02-01')
      );

      expect(GoogleBooksService.getBookById).toHaveBeenCalledWith('g1');
      expect(BooksRepository.upsert).toHaveBeenCalledWith('g1', bookData);
      expect(BookClubBooksRepository.create).toHaveBeenCalledWith({
        bookClubId: 'bc-1',
        bookId: 'b-1',
        status: 'current',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-02-01'),
        addedById: 'user-1',
      });
      expect(result).toEqual(bookClubBook);
    });

    it('should default status to upcoming and dates to null', async () => {
      (GoogleBooksService.getBookById as jest.Mock).mockResolvedValue({ googleBooksId: 'g1' });
      (BooksRepository.upsert as jest.Mock).mockResolvedValue({ id: 'b-1' });
      (BookClubBooksRepository.create as jest.Mock).mockResolvedValue({});

      await BookClubBooksService.addBookClubBook('bc-1', 'user-1', 'g1');

      expect(BookClubBooksRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'upcoming', startDate: null, endDate: null })
      );
    });
  });

  describe('updateBookClubBook', () => {
    it('should update when bookclub book exists', async () => {
      const existing = { id: 'bcb-1' };
      const updated = { id: 'bcb-1', status: 'completed' };
      (BookClubBooksRepository.findOne as jest.Mock).mockResolvedValue(existing);
      (BookClubBooksRepository.update as jest.Mock).mockResolvedValue(updated);

      const result = await BookClubBooksService.updateBookClubBook('bc-1', 'b-1', { status: 'completed' as any });

      expect(BookClubBooksRepository.update).toHaveBeenCalledWith('bc-1', 'b-1', { status: 'completed' });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundError when bookclub book does not exist', async () => {
      (BookClubBooksRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        BookClubBooksService.updateBookClubBook('bc-1', 'b-1', { status: 'completed' as any })
      ).rejects.toThrow(NotFoundError);
    });

    it('should only include provided fields in update', async () => {
      (BookClubBooksRepository.findOne as jest.Mock).mockResolvedValue({ id: 'bcb-1' });
      (BookClubBooksRepository.update as jest.Mock).mockResolvedValue({});

      await BookClubBooksService.updateBookClubBook('bc-1', 'b-1', {});

      expect(BookClubBooksRepository.update).toHaveBeenCalledWith('bc-1', 'b-1', {});
    });
  });

  describe('deleteBookClubBook', () => {
    it('should delete when book exists', async () => {
      (BookClubBooksRepository.findOne as jest.Mock).mockResolvedValue({ id: 'bcb-1' });
      (BookClubBooksRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await BookClubBooksService.deleteBookClubBook('bc-1', 'b-1');

      expect(BookClubBooksRepository.delete).toHaveBeenCalledWith('bc-1', 'b-1');
    });

    it('should throw NotFoundError when book does not exist', async () => {
      (BookClubBooksRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(BookClubBooksService.deleteBookClubBook('bc-1', 'b-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getBatchCurrentBooks', () => {
    it('should return current books mapped to bookclub IDs', async () => {
      const currentBooks = [
        { bookClubId: 'bc-1', book: { title: 'Book 1' } },
        { bookClubId: 'bc-3', book: { title: 'Book 3' } },
      ];
      (BookClubBooksRepository.findCurrentByBookClubIds as jest.Mock).mockResolvedValue(currentBooks);

      const result = await BookClubBooksService.getBatchCurrentBooks(['bc-1', 'bc-2', 'bc-3']);

      expect(BookClubBooksRepository.findCurrentByBookClubIds).toHaveBeenCalledWith(['bc-1', 'bc-2', 'bc-3']);
      expect(result).toEqual([
        { bookClubId: 'bc-1', currentBook: currentBooks[0] },
        { bookClubId: 'bc-2', currentBook: null },
        { bookClubId: 'bc-3', currentBook: currentBooks[1] },
      ]);
    });

    it('should return null for all if no current books', async () => {
      (BookClubBooksRepository.findCurrentByBookClubIds as jest.Mock).mockResolvedValue([]);

      const result = await BookClubBooksService.getBatchCurrentBooks(['bc-1']);

      expect(result).toEqual([{ bookClubId: 'bc-1', currentBook: null }]);
    });
  });
});
