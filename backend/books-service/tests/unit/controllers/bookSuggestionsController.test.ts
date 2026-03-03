import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../src/middleware/authMiddleware';
import {
  getSuggestions,
  createSuggestion,
  voteSuggestion,
  acceptSuggestion,
  deleteSuggestion,
} from '../../../src/controllers/bookSuggestionsController';
import { BookSuggestionsService } from '../../../src/services/bookSuggestions.service';

jest.mock('../../../src/services/bookSuggestions.service');

describe('BookSuggestionsController', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    mockNext = jest.fn();
    mockReq = {
      user: { userId: 'user-1', email: 'test@test.com', role: 'user', name: 'Test User' },
      query: {},
      params: { bookClubId: 'bc-1' },
      body: {},
    };
    mockRes = { json: jsonMock } as Partial<Response>;
    jest.clearAllMocks();
  });

  describe('getSuggestions', () => {
    it('should return paginated suggestions', async () => {
      const result = { data: [{ id: 's1' }], total: 1, page: 1, totalPages: 1 };
      (BookSuggestionsService.getSuggestions as jest.Mock).mockResolvedValue(result);

      await getSuggestions(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(BookSuggestionsService.getSuggestions).toHaveBeenCalledWith('bc-1', 'user-1', 1, 20);
      expect(jsonMock).toHaveBeenCalledWith({ success: true, ...result });
    });

    it('should pass pagination params', async () => {
      mockReq.query = { page: '2', limit: '5' };
      (BookSuggestionsService.getSuggestions as jest.Mock).mockResolvedValue({ data: [], total: 0, page: 2, totalPages: 0 });

      await getSuggestions(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(BookSuggestionsService.getSuggestions).toHaveBeenCalledWith('bc-1', 'user-1', 2, 5);
    });

    it('should call next(error) on failure', async () => {
      const error = new Error('fail');
      (BookSuggestionsService.getSuggestions as jest.Mock).mockRejectedValue(error);

      await getSuggestions(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createSuggestion', () => {
    it('should create suggestion and attach user info', async () => {
      mockReq.body = { googleBooksId: 'g1', reason: 'Great read' };
      const suggestion = { id: 's1', bookId: 'b1', suggestedById: 'user-1' };
      (BookSuggestionsService.suggestBook as jest.Mock).mockResolvedValue(suggestion);

      await createSuggestion(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(BookSuggestionsService.suggestBook).toHaveBeenCalledWith('bc-1', 'user-1', 'g1', 'Great read');
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          ...suggestion,
          suggestedBy: { id: 'user-1', name: 'Test User' },
        },
      });
    });

    it('should default name to "User" if not set', async () => {
      mockReq.user = { userId: 'user-1', email: 'test@test.com', role: 'user' };
      mockReq.body = { googleBooksId: 'g1' };
      (BookSuggestionsService.suggestBook as jest.Mock).mockResolvedValue({ id: 's1' });

      await createSuggestion(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            suggestedBy: { id: 'user-1', name: 'User' },
          }),
        })
      );
    });

    it('should call next(error) on failure', async () => {
      mockReq.body = { googleBooksId: 'g1' };
      const error = new Error('conflict');
      (BookSuggestionsService.suggestBook as jest.Mock).mockRejectedValue(error);

      await createSuggestion(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('voteSuggestion', () => {
    it('should record vote', async () => {
      mockReq.params = { suggestionId: 's1' };
      mockReq.body = { voteType: 'upvote' };
      const result = { vote: {}, upvotes: 3, downvotes: 1 };
      (BookSuggestionsService.vote as jest.Mock).mockResolvedValue(result);

      await voteSuggestion(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(BookSuggestionsService.vote).toHaveBeenCalledWith('s1', 'user-1', 'upvote');
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: result });
    });

    it('should call next(error) on failure', async () => {
      mockReq.params = { suggestionId: 's1' };
      mockReq.body = { voteType: 'upvote' };
      const error = new Error('not found');
      (BookSuggestionsService.vote as jest.Mock).mockRejectedValue(error);

      await voteSuggestion(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('acceptSuggestion', () => {
    it('should accept suggestion', async () => {
      mockReq.params = { bookClubId: 'bc-1', suggestionId: 's1' };
      mockReq.body = { startDate: '2025-01-01', endDate: '2025-02-01' };
      const bookClubBook = { id: 'bcb-1', status: 'current' };
      (BookSuggestionsService.acceptSuggestion as jest.Mock).mockResolvedValue(bookClubBook);

      await acceptSuggestion(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(BookSuggestionsService.acceptSuggestion).toHaveBeenCalledWith(
        'bc-1', 's1', 'user-1', new Date('2025-01-01'), new Date('2025-02-01')
      );
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: bookClubBook });
    });

    it('should call next(error) on failure', async () => {
      mockReq.params = { bookClubId: 'bc-1', suggestionId: 's1' };
      mockReq.body = { startDate: '2025-01-01', endDate: '2025-02-01' };
      const error = new Error('not found');
      (BookSuggestionsService.acceptSuggestion as jest.Mock).mockRejectedValue(error);

      await acceptSuggestion(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteSuggestion', () => {
    it('should delete suggestion', async () => {
      mockReq.params = { suggestionId: 's1' };
      (BookSuggestionsService.deleteSuggestion as jest.Mock).mockResolvedValue(undefined);

      await deleteSuggestion(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(BookSuggestionsService.deleteSuggestion).toHaveBeenCalledWith('s1', 'user-1');
      expect(jsonMock).toHaveBeenCalledWith({ success: true, message: 'Suggestion deleted successfully' });
    });

    it('should call next(error) on failure', async () => {
      mockReq.params = { suggestionId: 's1' };
      const error = new Error('forbidden');
      (BookSuggestionsService.deleteSuggestion as jest.Mock).mockRejectedValue(error);

      await deleteSuggestion(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
