import { BookSuggestionsService } from '../../../src/services/bookSuggestions.service';
import { BookSuggestionsRepository } from '../../../src/repositories/bookSuggestions.repository';
import { BooksRepository } from '../../../src/repositories/books.repository';
import { GoogleBooksService } from '../../../src/services/googleBooks.service';
import { NotFoundError, ConflictError, ForbiddenError } from '../../../src/utils/errors';

jest.mock('../../../src/repositories/bookSuggestions.repository');
jest.mock('../../../src/repositories/books.repository');
jest.mock('../../../src/services/googleBooks.service');
jest.mock('../../../src/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('BookSuggestionsService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getSuggestions', () => {
    it('should return suggestions with user vote info', async () => {
      const repoResult = {
        suggestions: [
          {
            id: 's1',
            suggestedById: 'user-2',
            votes: [
              { userId: 'user-1', voteType: 'upvote' },
              { userId: 'user-3', voteType: 'downvote' },
            ],
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      (BookSuggestionsRepository.findPendingByBookClubId as jest.Mock).mockResolvedValue(repoResult);

      const result = await BookSuggestionsService.getSuggestions('bc-1', 'user-1', 1, 20);

      expect(result.data[0].userVote).toBe('upvote');
      expect(result.data[0].suggestedBy).toEqual({ id: 'user-2', name: 'User' });
    });

    it('should return null userVote when user has not voted', async () => {
      const repoResult = {
        suggestions: [{ id: 's1', suggestedById: 'user-2', votes: [] }],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      (BookSuggestionsRepository.findPendingByBookClubId as jest.Mock).mockResolvedValue(repoResult);

      const result = await BookSuggestionsService.getSuggestions('bc-1', 'user-1', 1, 20);

      expect(result.data[0].userVote).toBeNull();
    });

    it('should pass pagination to repository', async () => {
      (BookSuggestionsRepository.findPendingByBookClubId as jest.Mock).mockResolvedValue({
        suggestions: [], total: 0, page: 2, totalPages: 0,
      });

      await BookSuggestionsService.getSuggestions('bc-1', 'user-1', 2, 5);

      expect(BookSuggestionsRepository.findPendingByBookClubId).toHaveBeenCalledWith('bc-1', 2, 5);
    });
  });

  describe('suggestBook', () => {
    it('should create a new suggestion', async () => {
      (BooksRepository.findByGoogleBooksId as jest.Mock).mockResolvedValue(null);
      const bookData = { googleBooksId: 'g1', title: 'Test' };
      const book = { id: 'b-1', ...bookData };
      const suggestion = { id: 's1', bookId: 'b-1' };

      (GoogleBooksService.getBookById as jest.Mock).mockResolvedValue(bookData);
      (BooksRepository.upsert as jest.Mock).mockResolvedValue(book);
      (BookSuggestionsRepository.create as jest.Mock).mockResolvedValue(suggestion);

      const result = await BookSuggestionsService.suggestBook('bc-1', 'user-1', 'g1', 'Good book');

      expect(BookSuggestionsRepository.create).toHaveBeenCalledWith({
        bookClubId: 'bc-1',
        bookId: 'b-1',
        suggestedById: 'user-1',
        reason: 'Good book',
      });
      expect(result).toEqual(suggestion);
    });

    it('should throw ConflictError when book is already suggested', async () => {
      (BooksRepository.findByGoogleBooksId as jest.Mock).mockResolvedValue({ id: 'b-1' });
      (BookSuggestionsRepository.findPendingByBookAndClub as jest.Mock).mockResolvedValue({ id: 's1' });

      await expect(
        BookSuggestionsService.suggestBook('bc-1', 'user-1', 'g1')
      ).rejects.toThrow(ConflictError);
    });

    it('should allow suggestion when book exists but not pending in this club', async () => {
      (BooksRepository.findByGoogleBooksId as jest.Mock).mockResolvedValue({ id: 'b-1' });
      (BookSuggestionsRepository.findPendingByBookAndClub as jest.Mock).mockResolvedValue(null);
      (GoogleBooksService.getBookById as jest.Mock).mockResolvedValue({ googleBooksId: 'g1' });
      (BooksRepository.upsert as jest.Mock).mockResolvedValue({ id: 'b-1' });
      (BookSuggestionsRepository.create as jest.Mock).mockResolvedValue({ id: 's1' });

      const result = await BookSuggestionsService.suggestBook('bc-1', 'user-1', 'g1');

      expect(result).toEqual({ id: 's1' });
    });

    it('should set reason to null when not provided', async () => {
      (BooksRepository.findByGoogleBooksId as jest.Mock).mockResolvedValue(null);
      (GoogleBooksService.getBookById as jest.Mock).mockResolvedValue({ googleBooksId: 'g1' });
      (BooksRepository.upsert as jest.Mock).mockResolvedValue({ id: 'b-1' });
      (BookSuggestionsRepository.create as jest.Mock).mockResolvedValue({ id: 's1' });

      await BookSuggestionsService.suggestBook('bc-1', 'user-1', 'g1');

      expect(BookSuggestionsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ reason: null })
      );
    });
  });

  describe('vote', () => {
    it('should record vote on existing suggestion', async () => {
      (BookSuggestionsRepository.findById as jest.Mock).mockResolvedValue({ id: 's1' });
      const voteResult = { vote: {}, upvotes: 3, downvotes: 1 };
      (BookSuggestionsRepository.upsertVoteWithCounts as jest.Mock).mockResolvedValue(voteResult);

      const result = await BookSuggestionsService.vote('s1', 'user-1', 'upvote' as any);

      expect(BookSuggestionsRepository.upsertVoteWithCounts).toHaveBeenCalledWith('s1', 'user-1', 'upvote');
      expect(result).toEqual(voteResult);
    });

    it('should throw NotFoundError for non-existent suggestion', async () => {
      (BookSuggestionsRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        BookSuggestionsService.vote('s1', 'user-1', 'upvote' as any)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('acceptSuggestion', () => {
    it('should accept suggestion', async () => {
      const suggestion = { id: 's1', bookId: 'b-1' };
      const bookClubBook = { id: 'bcb-1', status: 'current' };
      (BookSuggestionsRepository.findById as jest.Mock).mockResolvedValue(suggestion);
      (BookSuggestionsRepository.acceptSuggestion as jest.Mock).mockResolvedValue(bookClubBook);

      const result = await BookSuggestionsService.acceptSuggestion(
        'bc-1', 's1', 'user-1', new Date('2025-01-01'), new Date('2025-02-01')
      );

      expect(BookSuggestionsRepository.acceptSuggestion).toHaveBeenCalledWith(
        'bc-1', 's1', 'b-1', 'user-1', new Date('2025-01-01'), new Date('2025-02-01')
      );
      expect(result).toEqual(bookClubBook);
    });

    it('should throw NotFoundError for non-existent suggestion', async () => {
      (BookSuggestionsRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        BookSuggestionsService.acceptSuggestion('bc-1', 's1', 'user-1', new Date(), new Date())
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteSuggestion', () => {
    it('should delete own suggestion', async () => {
      (BookSuggestionsRepository.findById as jest.Mock).mockResolvedValue({
        id: 's1', suggestedById: 'user-1',
      });
      (BookSuggestionsRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await BookSuggestionsService.deleteSuggestion('s1', 'user-1');

      expect(BookSuggestionsRepository.delete).toHaveBeenCalledWith('s1');
    });

    it('should throw NotFoundError for non-existent suggestion', async () => {
      (BookSuggestionsRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(BookSuggestionsService.deleteSuggestion('s1', 'user-1')).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when deleting another users suggestion', async () => {
      (BookSuggestionsRepository.findById as jest.Mock).mockResolvedValue({
        id: 's1', suggestedById: 'other-user',
      });

      await expect(BookSuggestionsService.deleteSuggestion('s1', 'user-1')).rejects.toThrow(ForbiddenError);
    });
  });
});
