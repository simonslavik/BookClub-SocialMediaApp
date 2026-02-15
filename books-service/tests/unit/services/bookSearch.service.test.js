"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bookSearch_service_1 = require("../../../src/services/bookSearch.service");
const googleBooks_service_1 = require("../../../src/services/googleBooks.service");
const errors_1 = require("../../../src/utils/errors");
jest.mock('../../../src/services/googleBooks.service');
jest.mock('../../../src/utils/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));
describe('BookSearchService', () => {
    beforeEach(() => jest.clearAllMocks());
    describe('searchBooks', () => {
        it('should prefix plain queries with intitle:', async () => {
            googleBooks_service_1.GoogleBooksService.searchBooks.mockResolvedValue([]);
            await bookSearch_service_1.BookSearchService.searchBooks('typescript');
            expect(googleBooks_service_1.GoogleBooksService.searchBooks).toHaveBeenCalledWith('intitle:typescript', 20);
        });
        it('should not add prefix when query already has an operator', async () => {
            googleBooks_service_1.GoogleBooksService.searchBooks.mockResolvedValue([]);
            await bookSearch_service_1.BookSearchService.searchBooks('inauthor:Tolkien');
            expect(googleBooks_service_1.GoogleBooksService.searchBooks).toHaveBeenCalledWith('inauthor:Tolkien', 20);
        });
        it('should detect ISBN patterns', async () => {
            googleBooks_service_1.GoogleBooksService.searchBooks.mockResolvedValue([]);
            await bookSearch_service_1.BookSearchService.searchBooks('978-0134685991');
            expect(googleBooks_service_1.GoogleBooksService.searchBooks).toHaveBeenCalledWith('isbn:9780134685991', 20);
        });
        it('should cap limit at 40', async () => {
            googleBooks_service_1.GoogleBooksService.searchBooks.mockResolvedValue([]);
            await bookSearch_service_1.BookSearchService.searchBooks('test', 100);
            expect(googleBooks_service_1.GoogleBooksService.searchBooks).toHaveBeenCalledWith('intitle:test', 40);
        });
        it('should throw ValidationError for empty query', async () => {
            await expect(bookSearch_service_1.BookSearchService.searchBooks('')).rejects.toThrow(errors_1.ValidationError);
            await expect(bookSearch_service_1.BookSearchService.searchBooks('  ')).rejects.toThrow(errors_1.ValidationError);
        });
        it('should return results from GoogleBooksService', async () => {
            const books = [{ googleBooksId: 'g1', title: 'Test' }];
            googleBooks_service_1.GoogleBooksService.searchBooks.mockResolvedValue(books);
            const result = await bookSearch_service_1.BookSearchService.searchBooks('test');
            expect(result).toEqual(books);
        });
    });
    describe('getBookDetails', () => {
        it('should fetch book details by ID', async () => {
            const book = { googleBooksId: 'g1', title: 'Test' };
            googleBooks_service_1.GoogleBooksService.getBookById.mockResolvedValue(book);
            const result = await bookSearch_service_1.BookSearchService.getBookDetails('g1');
            expect(googleBooks_service_1.GoogleBooksService.getBookById).toHaveBeenCalledWith('g1');
            expect(result).toEqual(book);
        });
        it('should throw ValidationError for empty googleBooksId', async () => {
            await expect(bookSearch_service_1.BookSearchService.getBookDetails('')).rejects.toThrow(errors_1.ValidationError);
        });
        it('should propagate errors from GoogleBooksService', async () => {
            googleBooks_service_1.GoogleBooksService.getBookById.mockRejectedValue(new Error('API fail'));
            await expect(bookSearch_service_1.BookSearchService.getBookDetails('g1')).rejects.toThrow('API fail');
        });
    });
});
