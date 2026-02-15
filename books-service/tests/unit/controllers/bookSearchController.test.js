"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bookSearchController_1 = require("../../../src/controllers/bookSearchController");
const bookSearch_service_1 = require("../../../src/services/bookSearch.service");
jest.mock('../../../src/services/bookSearch.service');
describe('BookSearchController', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    let jsonMock;
    beforeEach(() => {
        jsonMock = jest.fn();
        mockNext = jest.fn();
        mockReq = { query: {}, params: {} };
        mockRes = { json: jsonMock };
        jest.clearAllMocks();
    });
    describe('searchBooks', () => {
        it('should return search results', async () => {
            mockReq.query = { q: 'typescript', limit: '10' };
            const books = [{ googleBooksId: 'g1', title: 'TypeScript' }];
            bookSearch_service_1.BookSearchService.searchBooks.mockResolvedValue(books);
            await (0, bookSearchController_1.searchBooks)(mockReq, mockRes, mockNext);
            expect(bookSearch_service_1.BookSearchService.searchBooks).toHaveBeenCalledWith('typescript', 10);
            expect(jsonMock).toHaveBeenCalledWith({ success: true, data: books });
        });
        it('should default limit to 10', async () => {
            mockReq.query = { q: 'test' };
            bookSearch_service_1.BookSearchService.searchBooks.mockResolvedValue([]);
            await (0, bookSearchController_1.searchBooks)(mockReq, mockRes, mockNext);
            expect(bookSearch_service_1.BookSearchService.searchBooks).toHaveBeenCalledWith('test', 10);
        });
        it('should call next(error) on failure', async () => {
            mockReq.query = { q: 'test' };
            const error = new Error('API error');
            bookSearch_service_1.BookSearchService.searchBooks.mockRejectedValue(error);
            await (0, bookSearchController_1.searchBooks)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('getBookDetails', () => {
        it('should return book details', async () => {
            mockReq.params = { googleBooksId: 'g1' };
            const book = { googleBooksId: 'g1', title: 'Test' };
            bookSearch_service_1.BookSearchService.getBookDetails.mockResolvedValue(book);
            await (0, bookSearchController_1.getBookDetails)(mockReq, mockRes, mockNext);
            expect(bookSearch_service_1.BookSearchService.getBookDetails).toHaveBeenCalledWith('g1');
            expect(jsonMock).toHaveBeenCalledWith({ success: true, data: book });
        });
        it('should call next(error) on failure', async () => {
            mockReq.params = { googleBooksId: 'g1' };
            const error = new Error('not found');
            bookSearch_service_1.BookSearchService.getBookDetails.mockRejectedValue(error);
            await (0, bookSearchController_1.getBookDetails)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
});
