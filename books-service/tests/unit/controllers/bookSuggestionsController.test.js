"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bookSuggestionsController_1 = require("../../../src/controllers/bookSuggestionsController");
const bookSuggestions_service_1 = require("../../../src/services/bookSuggestions.service");
jest.mock('../../../src/services/bookSuggestions.service');
describe('BookSuggestionsController', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    let jsonMock;
    beforeEach(() => {
        jsonMock = jest.fn();
        mockNext = jest.fn();
        mockReq = {
            user: { userId: 'user-1', email: 'test@test.com', role: 'user', name: 'Test User' },
            query: {},
            params: { bookClubId: 'bc-1' },
            body: {},
        };
        mockRes = { json: jsonMock };
        jest.clearAllMocks();
    });
    describe('getSuggestions', () => {
        it('should return paginated suggestions', async () => {
            const result = { data: [{ id: 's1' }], total: 1, page: 1, totalPages: 1 };
            bookSuggestions_service_1.BookSuggestionsService.getSuggestions.mockResolvedValue(result);
            await (0, bookSuggestionsController_1.getSuggestions)(mockReq, mockRes, mockNext);
            expect(bookSuggestions_service_1.BookSuggestionsService.getSuggestions).toHaveBeenCalledWith('bc-1', 'user-1', 1, 20);
            expect(jsonMock).toHaveBeenCalledWith({ success: true, ...result });
        });
        it('should pass pagination params', async () => {
            mockReq.query = { page: '2', limit: '5' };
            bookSuggestions_service_1.BookSuggestionsService.getSuggestions.mockResolvedValue({ data: [], total: 0, page: 2, totalPages: 0 });
            await (0, bookSuggestionsController_1.getSuggestions)(mockReq, mockRes, mockNext);
            expect(bookSuggestions_service_1.BookSuggestionsService.getSuggestions).toHaveBeenCalledWith('bc-1', 'user-1', 2, 5);
        });
        it('should call next(error) on failure', async () => {
            const error = new Error('fail');
            bookSuggestions_service_1.BookSuggestionsService.getSuggestions.mockRejectedValue(error);
            await (0, bookSuggestionsController_1.getSuggestions)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('createSuggestion', () => {
        it('should create suggestion and attach user info', async () => {
            mockReq.body = { googleBooksId: 'g1', reason: 'Great read' };
            const suggestion = { id: 's1', bookId: 'b1', suggestedById: 'user-1' };
            bookSuggestions_service_1.BookSuggestionsService.suggestBook.mockResolvedValue(suggestion);
            await (0, bookSuggestionsController_1.createSuggestion)(mockReq, mockRes, mockNext);
            expect(bookSuggestions_service_1.BookSuggestionsService.suggestBook).toHaveBeenCalledWith('bc-1', 'user-1', 'g1', 'Great read');
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
            bookSuggestions_service_1.BookSuggestionsService.suggestBook.mockResolvedValue({ id: 's1' });
            await (0, bookSuggestionsController_1.createSuggestion)(mockReq, mockRes, mockNext);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    suggestedBy: { id: 'user-1', name: 'User' },
                }),
            }));
        });
        it('should call next(error) on failure', async () => {
            mockReq.body = { googleBooksId: 'g1' };
            const error = new Error('conflict');
            bookSuggestions_service_1.BookSuggestionsService.suggestBook.mockRejectedValue(error);
            await (0, bookSuggestionsController_1.createSuggestion)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('voteSuggestion', () => {
        it('should record vote', async () => {
            mockReq.params = { suggestionId: 's1' };
            mockReq.body = { voteType: 'upvote' };
            const result = { vote: {}, upvotes: 3, downvotes: 1 };
            bookSuggestions_service_1.BookSuggestionsService.vote.mockResolvedValue(result);
            await (0, bookSuggestionsController_1.voteSuggestion)(mockReq, mockRes, mockNext);
            expect(bookSuggestions_service_1.BookSuggestionsService.vote).toHaveBeenCalledWith('s1', 'user-1', 'upvote');
            expect(jsonMock).toHaveBeenCalledWith({ success: true, data: result });
        });
        it('should call next(error) on failure', async () => {
            mockReq.params = { suggestionId: 's1' };
            mockReq.body = { voteType: 'upvote' };
            const error = new Error('not found');
            bookSuggestions_service_1.BookSuggestionsService.vote.mockRejectedValue(error);
            await (0, bookSuggestionsController_1.voteSuggestion)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('acceptSuggestion', () => {
        it('should accept suggestion', async () => {
            mockReq.params = { bookClubId: 'bc-1', suggestionId: 's1' };
            mockReq.body = { startDate: '2025-01-01', endDate: '2025-02-01' };
            const bookClubBook = { id: 'bcb-1', status: 'current' };
            bookSuggestions_service_1.BookSuggestionsService.acceptSuggestion.mockResolvedValue(bookClubBook);
            await (0, bookSuggestionsController_1.acceptSuggestion)(mockReq, mockRes, mockNext);
            expect(bookSuggestions_service_1.BookSuggestionsService.acceptSuggestion).toHaveBeenCalledWith('bc-1', 's1', 'user-1', new Date('2025-01-01'), new Date('2025-02-01'));
            expect(jsonMock).toHaveBeenCalledWith({ success: true, data: bookClubBook });
        });
        it('should call next(error) on failure', async () => {
            mockReq.params = { bookClubId: 'bc-1', suggestionId: 's1' };
            mockReq.body = { startDate: '2025-01-01', endDate: '2025-02-01' };
            const error = new Error('not found');
            bookSuggestions_service_1.BookSuggestionsService.acceptSuggestion.mockRejectedValue(error);
            await (0, bookSuggestionsController_1.acceptSuggestion)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('deleteSuggestion', () => {
        it('should delete suggestion', async () => {
            mockReq.params = { suggestionId: 's1' };
            bookSuggestions_service_1.BookSuggestionsService.deleteSuggestion.mockResolvedValue(undefined);
            await (0, bookSuggestionsController_1.deleteSuggestion)(mockReq, mockRes, mockNext);
            expect(bookSuggestions_service_1.BookSuggestionsService.deleteSuggestion).toHaveBeenCalledWith('s1', 'user-1');
            expect(jsonMock).toHaveBeenCalledWith({ success: true, message: 'Suggestion deleted successfully' });
        });
        it('should call next(error) on failure', async () => {
            mockReq.params = { suggestionId: 's1' };
            const error = new Error('forbidden');
            bookSuggestions_service_1.BookSuggestionsService.deleteSuggestion.mockRejectedValue(error);
            await (0, bookSuggestionsController_1.deleteSuggestion)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
});
