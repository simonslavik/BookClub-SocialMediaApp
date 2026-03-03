"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bookSuggestions_service_1 = require("../../../src/services/bookSuggestions.service");
const bookSuggestions_repository_1 = require("../../../src/repositories/bookSuggestions.repository");
const books_repository_1 = require("../../../src/repositories/books.repository");
const googleBooks_service_1 = require("../../../src/services/googleBooks.service");
const errors_1 = require("../../../src/utils/errors");
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
            bookSuggestions_repository_1.BookSuggestionsRepository.findPendingByBookClubId.mockResolvedValue(repoResult);
            const result = await bookSuggestions_service_1.BookSuggestionsService.getSuggestions('bc-1', 'user-1', 1, 20);
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
            bookSuggestions_repository_1.BookSuggestionsRepository.findPendingByBookClubId.mockResolvedValue(repoResult);
            const result = await bookSuggestions_service_1.BookSuggestionsService.getSuggestions('bc-1', 'user-1', 1, 20);
            expect(result.data[0].userVote).toBeNull();
        });
        it('should pass pagination to repository', async () => {
            bookSuggestions_repository_1.BookSuggestionsRepository.findPendingByBookClubId.mockResolvedValue({
                suggestions: [], total: 0, page: 2, totalPages: 0,
            });
            await bookSuggestions_service_1.BookSuggestionsService.getSuggestions('bc-1', 'user-1', 2, 5);
            expect(bookSuggestions_repository_1.BookSuggestionsRepository.findPendingByBookClubId).toHaveBeenCalledWith('bc-1', 2, 5);
        });
    });
    describe('suggestBook', () => {
        it('should create a new suggestion', async () => {
            books_repository_1.BooksRepository.findByGoogleBooksId.mockResolvedValue(null);
            const bookData = { googleBooksId: 'g1', title: 'Test' };
            const book = { id: 'b-1', ...bookData };
            const suggestion = { id: 's1', bookId: 'b-1' };
            googleBooks_service_1.GoogleBooksService.getBookById.mockResolvedValue(bookData);
            books_repository_1.BooksRepository.upsert.mockResolvedValue(book);
            bookSuggestions_repository_1.BookSuggestionsRepository.create.mockResolvedValue(suggestion);
            const result = await bookSuggestions_service_1.BookSuggestionsService.suggestBook('bc-1', 'user-1', 'g1', 'Good book');
            expect(bookSuggestions_repository_1.BookSuggestionsRepository.create).toHaveBeenCalledWith({
                bookClubId: 'bc-1',
                bookId: 'b-1',
                suggestedById: 'user-1',
                reason: 'Good book',
            });
            expect(result).toEqual(suggestion);
        });
        it('should throw ConflictError when book is already suggested', async () => {
            books_repository_1.BooksRepository.findByGoogleBooksId.mockResolvedValue({ id: 'b-1' });
            bookSuggestions_repository_1.BookSuggestionsRepository.findPendingByBookAndClub.mockResolvedValue({ id: 's1' });
            await expect(bookSuggestions_service_1.BookSuggestionsService.suggestBook('bc-1', 'user-1', 'g1')).rejects.toThrow(errors_1.ConflictError);
        });
        it('should allow suggestion when book exists but not pending in this club', async () => {
            books_repository_1.BooksRepository.findByGoogleBooksId.mockResolvedValue({ id: 'b-1' });
            bookSuggestions_repository_1.BookSuggestionsRepository.findPendingByBookAndClub.mockResolvedValue(null);
            googleBooks_service_1.GoogleBooksService.getBookById.mockResolvedValue({ googleBooksId: 'g1' });
            books_repository_1.BooksRepository.upsert.mockResolvedValue({ id: 'b-1' });
            bookSuggestions_repository_1.BookSuggestionsRepository.create.mockResolvedValue({ id: 's1' });
            const result = await bookSuggestions_service_1.BookSuggestionsService.suggestBook('bc-1', 'user-1', 'g1');
            expect(result).toEqual({ id: 's1' });
        });
        it('should set reason to null when not provided', async () => {
            books_repository_1.BooksRepository.findByGoogleBooksId.mockResolvedValue(null);
            googleBooks_service_1.GoogleBooksService.getBookById.mockResolvedValue({ googleBooksId: 'g1' });
            books_repository_1.BooksRepository.upsert.mockResolvedValue({ id: 'b-1' });
            bookSuggestions_repository_1.BookSuggestionsRepository.create.mockResolvedValue({ id: 's1' });
            await bookSuggestions_service_1.BookSuggestionsService.suggestBook('bc-1', 'user-1', 'g1');
            expect(bookSuggestions_repository_1.BookSuggestionsRepository.create).toHaveBeenCalledWith(expect.objectContaining({ reason: null }));
        });
    });
    describe('vote', () => {
        it('should record vote on existing suggestion', async () => {
            bookSuggestions_repository_1.BookSuggestionsRepository.findById.mockResolvedValue({ id: 's1' });
            const voteResult = { vote: {}, upvotes: 3, downvotes: 1 };
            bookSuggestions_repository_1.BookSuggestionsRepository.upsertVoteWithCounts.mockResolvedValue(voteResult);
            const result = await bookSuggestions_service_1.BookSuggestionsService.vote('s1', 'user-1', 'upvote');
            expect(bookSuggestions_repository_1.BookSuggestionsRepository.upsertVoteWithCounts).toHaveBeenCalledWith('s1', 'user-1', 'upvote');
            expect(result).toEqual(voteResult);
        });
        it('should throw NotFoundError for non-existent suggestion', async () => {
            bookSuggestions_repository_1.BookSuggestionsRepository.findById.mockResolvedValue(null);
            await expect(bookSuggestions_service_1.BookSuggestionsService.vote('s1', 'user-1', 'upvote')).rejects.toThrow(errors_1.NotFoundError);
        });
    });
    describe('acceptSuggestion', () => {
        it('should accept suggestion', async () => {
            const suggestion = { id: 's1', bookId: 'b-1' };
            const bookClubBook = { id: 'bcb-1', status: 'current' };
            bookSuggestions_repository_1.BookSuggestionsRepository.findById.mockResolvedValue(suggestion);
            bookSuggestions_repository_1.BookSuggestionsRepository.acceptSuggestion.mockResolvedValue(bookClubBook);
            const result = await bookSuggestions_service_1.BookSuggestionsService.acceptSuggestion('bc-1', 's1', 'user-1', new Date('2025-01-01'), new Date('2025-02-01'));
            expect(bookSuggestions_repository_1.BookSuggestionsRepository.acceptSuggestion).toHaveBeenCalledWith('bc-1', 's1', 'b-1', 'user-1', new Date('2025-01-01'), new Date('2025-02-01'));
            expect(result).toEqual(bookClubBook);
        });
        it('should throw NotFoundError for non-existent suggestion', async () => {
            bookSuggestions_repository_1.BookSuggestionsRepository.findById.mockResolvedValue(null);
            await expect(bookSuggestions_service_1.BookSuggestionsService.acceptSuggestion('bc-1', 's1', 'user-1', new Date(), new Date())).rejects.toThrow(errors_1.NotFoundError);
        });
    });
    describe('deleteSuggestion', () => {
        it('should delete own suggestion', async () => {
            bookSuggestions_repository_1.BookSuggestionsRepository.findById.mockResolvedValue({
                id: 's1', suggestedById: 'user-1',
            });
            bookSuggestions_repository_1.BookSuggestionsRepository.delete.mockResolvedValue(undefined);
            await bookSuggestions_service_1.BookSuggestionsService.deleteSuggestion('s1', 'user-1');
            expect(bookSuggestions_repository_1.BookSuggestionsRepository.delete).toHaveBeenCalledWith('s1');
        });
        it('should throw NotFoundError for non-existent suggestion', async () => {
            bookSuggestions_repository_1.BookSuggestionsRepository.findById.mockResolvedValue(null);
            await expect(bookSuggestions_service_1.BookSuggestionsService.deleteSuggestion('s1', 'user-1')).rejects.toThrow(errors_1.NotFoundError);
        });
        it('should throw ForbiddenError when deleting another users suggestion', async () => {
            bookSuggestions_repository_1.BookSuggestionsRepository.findById.mockResolvedValue({
                id: 's1', suggestedById: 'other-user',
            });
            await expect(bookSuggestions_service_1.BookSuggestionsService.deleteSuggestion('s1', 'user-1')).rejects.toThrow(errors_1.ForbiddenError);
        });
    });
});
