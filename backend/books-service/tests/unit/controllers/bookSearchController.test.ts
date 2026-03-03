import { Request, Response, NextFunction } from 'express';
import { searchBooks, getBookDetails } from '../../../src/controllers/bookSearchController';
import { BookSearchService } from '../../../src/services/bookSearch.service';

jest.mock('../../../src/services/bookSearch.service');

describe('BookSearchController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    mockNext = jest.fn();
    mockReq = { query: {}, params: {} };
    mockRes = { json: jsonMock } as Partial<Response>;
    jest.clearAllMocks();
  });

  describe('searchBooks', () => {
    it('should return search results', async () => {
      mockReq.query = { q: 'typescript', limit: '10' };
      const books = [{ googleBooksId: 'g1', title: 'TypeScript' }];
      (BookSearchService.searchBooks as jest.Mock).mockResolvedValue(books);

      await searchBooks(mockReq as Request, mockRes as Response, mockNext);

      expect(BookSearchService.searchBooks).toHaveBeenCalledWith('typescript', 10);
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: books });
    });

    it('should default limit to 10', async () => {
      mockReq.query = { q: 'test' };
      (BookSearchService.searchBooks as jest.Mock).mockResolvedValue([]);

      await searchBooks(mockReq as Request, mockRes as Response, mockNext);

      expect(BookSearchService.searchBooks).toHaveBeenCalledWith('test', 10);
    });

    it('should call next(error) on failure', async () => {
      mockReq.query = { q: 'test' };
      const error = new Error('API error');
      (BookSearchService.searchBooks as jest.Mock).mockRejectedValue(error);

      await searchBooks(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getBookDetails', () => {
    it('should return book details', async () => {
      mockReq.params = { googleBooksId: 'g1' };
      const book = { googleBooksId: 'g1', title: 'Test' };
      (BookSearchService.getBookDetails as jest.Mock).mockResolvedValue(book);

      await getBookDetails(mockReq as Request, mockRes as Response, mockNext);

      expect(BookSearchService.getBookDetails).toHaveBeenCalledWith('g1');
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: book });
    });

    it('should call next(error) on failure', async () => {
      mockReq.params = { googleBooksId: 'g1' };
      const error = new Error('not found');
      (BookSearchService.getBookDetails as jest.Mock).mockRejectedValue(error);

      await getBookDetails(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
