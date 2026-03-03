import { BookSearchService } from '../../../src/services/bookSearch.service';
import { GoogleBooksService } from '../../../src/services/googleBooks.service';
import { ValidationError } from '../../../src/utils/errors';

jest.mock('../../../src/services/googleBooks.service');
jest.mock('../../../src/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('BookSearchService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('searchBooks', () => {
    it('should prefix plain queries with intitle:', async () => {
      (GoogleBooksService.searchBooks as jest.Mock).mockResolvedValue([]);

      await BookSearchService.searchBooks('typescript');

      expect(GoogleBooksService.searchBooks).toHaveBeenCalledWith('intitle:typescript', 20);
    });

    it('should not add prefix when query already has an operator', async () => {
      (GoogleBooksService.searchBooks as jest.Mock).mockResolvedValue([]);

      await BookSearchService.searchBooks('inauthor:Tolkien');

      expect(GoogleBooksService.searchBooks).toHaveBeenCalledWith('inauthor:Tolkien', 20);
    });

    it('should detect ISBN patterns', async () => {
      (GoogleBooksService.searchBooks as jest.Mock).mockResolvedValue([]);

      await BookSearchService.searchBooks('978-0134685991');

      expect(GoogleBooksService.searchBooks).toHaveBeenCalledWith('isbn:9780134685991', 20);
    });

    it('should cap limit at 40', async () => {
      (GoogleBooksService.searchBooks as jest.Mock).mockResolvedValue([]);

      await BookSearchService.searchBooks('test', 100);

      expect(GoogleBooksService.searchBooks).toHaveBeenCalledWith('intitle:test', 40);
    });

    it('should throw ValidationError for empty query', async () => {
      await expect(BookSearchService.searchBooks('')).rejects.toThrow(ValidationError);
      await expect(BookSearchService.searchBooks('  ')).rejects.toThrow(ValidationError);
    });

    it('should return results from GoogleBooksService', async () => {
      const books = [{ googleBooksId: 'g1', title: 'Test' }];
      (GoogleBooksService.searchBooks as jest.Mock).mockResolvedValue(books);

      const result = await BookSearchService.searchBooks('test');

      expect(result).toEqual(books);
    });
  });

  describe('getBookDetails', () => {
    it('should fetch book details by ID', async () => {
      const book = { googleBooksId: 'g1', title: 'Test' };
      (GoogleBooksService.getBookById as jest.Mock).mockResolvedValue(book);

      const result = await BookSearchService.getBookDetails('g1');

      expect(GoogleBooksService.getBookById).toHaveBeenCalledWith('g1');
      expect(result).toEqual(book);
    });

    it('should throw ValidationError for empty googleBooksId', async () => {
      await expect(BookSearchService.getBookDetails('')).rejects.toThrow(ValidationError);
    });

    it('should propagate errors from GoogleBooksService', async () => {
      (GoogleBooksService.getBookById as jest.Mock).mockRejectedValue(new Error('API fail'));

      await expect(BookSearchService.getBookDetails('g1')).rejects.toThrow('API fail');
    });
  });
});
