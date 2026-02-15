"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bookClubBooks_service_1 = require("../../../src/services/bookClubBooks.service");
const bookClubBooks_repository_1 = require("../../../src/repositories/bookClubBooks.repository");
const books_repository_1 = require("../../../src/repositories/books.repository");
const googleBooks_service_1 = require("../../../src/services/googleBooks.service");
const errors_1 = require("../../../src/utils/errors");
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
            bookClubBooks_repository_1.BookClubBooksRepository.findByBookClubId.mockResolvedValue({ data, total: 1 });
            const result = await bookClubBooks_service_1.BookClubBooksService.getBookClubBooks('bc-1', undefined, 1, 20);
            expect(bookClubBooks_repository_1.BookClubBooksRepository.findByBookClubId).toHaveBeenCalledWith('bc-1', undefined, 0, 20);
            expect(result).toEqual({
                data,
                pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            });
        });
        it('should calculate skip and totalPages correctly', async () => {
            bookClubBooks_repository_1.BookClubBooksRepository.findByBookClubId.mockResolvedValue({ data: [], total: 45 });
            const result = await bookClubBooks_service_1.BookClubBooksService.getBookClubBooks('bc-1', undefined, 3, 10);
            expect(bookClubBooks_repository_1.BookClubBooksRepository.findByBookClubId).toHaveBeenCalledWith('bc-1', undefined, 20, 10);
            expect(result.pagination.totalPages).toBe(5);
        });
        it('should pass status filter', async () => {
            bookClubBooks_repository_1.BookClubBooksRepository.findByBookClubId.mockResolvedValue({ data: [], total: 0 });
            await bookClubBooks_service_1.BookClubBooksService.getBookClubBooks('bc-1', 'current');
            expect(bookClubBooks_repository_1.BookClubBooksRepository.findByBookClubId).toHaveBeenCalledWith('bc-1', 'current', 0, 20);
        });
    });
    describe('addBookClubBook', () => {
        it('should fetch book data, upsert book, and create bookclub book', async () => {
            const bookData = { googleBooksId: 'g1', title: 'Test' };
            const book = { id: 'b-1', ...bookData };
            const bookClubBook = { id: 'bcb-1', bookClubId: 'bc-1' };
            googleBooks_service_1.GoogleBooksService.getBookById.mockResolvedValue(bookData);
            books_repository_1.BooksRepository.upsert.mockResolvedValue(book);
            bookClubBooks_repository_1.BookClubBooksRepository.create.mockResolvedValue(bookClubBook);
            const result = await bookClubBooks_service_1.BookClubBooksService.addBookClubBook('bc-1', 'user-1', 'g1', 'current', new Date('2025-01-01'), new Date('2025-02-01'));
            expect(googleBooks_service_1.GoogleBooksService.getBookById).toHaveBeenCalledWith('g1');
            expect(books_repository_1.BooksRepository.upsert).toHaveBeenCalledWith('g1', bookData);
            expect(bookClubBooks_repository_1.BookClubBooksRepository.create).toHaveBeenCalledWith({
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
            googleBooks_service_1.GoogleBooksService.getBookById.mockResolvedValue({ googleBooksId: 'g1' });
            books_repository_1.BooksRepository.upsert.mockResolvedValue({ id: 'b-1' });
            bookClubBooks_repository_1.BookClubBooksRepository.create.mockResolvedValue({});
            await bookClubBooks_service_1.BookClubBooksService.addBookClubBook('bc-1', 'user-1', 'g1');
            expect(bookClubBooks_repository_1.BookClubBooksRepository.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'upcoming', startDate: null, endDate: null }));
        });
    });
    describe('updateBookClubBook', () => {
        it('should update when bookclub book exists', async () => {
            const existing = { id: 'bcb-1' };
            const updated = { id: 'bcb-1', status: 'completed' };
            bookClubBooks_repository_1.BookClubBooksRepository.findOne.mockResolvedValue(existing);
            bookClubBooks_repository_1.BookClubBooksRepository.update.mockResolvedValue(updated);
            const result = await bookClubBooks_service_1.BookClubBooksService.updateBookClubBook('bc-1', 'b-1', { status: 'completed' });
            expect(bookClubBooks_repository_1.BookClubBooksRepository.update).toHaveBeenCalledWith('bc-1', 'b-1', { status: 'completed' });
            expect(result).toEqual(updated);
        });
        it('should throw NotFoundError when bookclub book does not exist', async () => {
            bookClubBooks_repository_1.BookClubBooksRepository.findOne.mockResolvedValue(null);
            await expect(bookClubBooks_service_1.BookClubBooksService.updateBookClubBook('bc-1', 'b-1', { status: 'completed' })).rejects.toThrow(errors_1.NotFoundError);
        });
        it('should only include provided fields in update', async () => {
            bookClubBooks_repository_1.BookClubBooksRepository.findOne.mockResolvedValue({ id: 'bcb-1' });
            bookClubBooks_repository_1.BookClubBooksRepository.update.mockResolvedValue({});
            await bookClubBooks_service_1.BookClubBooksService.updateBookClubBook('bc-1', 'b-1', {});
            expect(bookClubBooks_repository_1.BookClubBooksRepository.update).toHaveBeenCalledWith('bc-1', 'b-1', {});
        });
    });
    describe('deleteBookClubBook', () => {
        it('should delete when book exists', async () => {
            bookClubBooks_repository_1.BookClubBooksRepository.findOne.mockResolvedValue({ id: 'bcb-1' });
            bookClubBooks_repository_1.BookClubBooksRepository.delete.mockResolvedValue(undefined);
            await bookClubBooks_service_1.BookClubBooksService.deleteBookClubBook('bc-1', 'b-1');
            expect(bookClubBooks_repository_1.BookClubBooksRepository.delete).toHaveBeenCalledWith('bc-1', 'b-1');
        });
        it('should throw NotFoundError when book does not exist', async () => {
            bookClubBooks_repository_1.BookClubBooksRepository.findOne.mockResolvedValue(null);
            await expect(bookClubBooks_service_1.BookClubBooksService.deleteBookClubBook('bc-1', 'b-1')).rejects.toThrow(errors_1.NotFoundError);
        });
    });
    describe('getBatchCurrentBooks', () => {
        it('should return current books mapped to bookclub IDs', async () => {
            const currentBooks = [
                { bookClubId: 'bc-1', book: { title: 'Book 1' } },
                { bookClubId: 'bc-3', book: { title: 'Book 3' } },
            ];
            bookClubBooks_repository_1.BookClubBooksRepository.findCurrentByBookClubIds.mockResolvedValue(currentBooks);
            const result = await bookClubBooks_service_1.BookClubBooksService.getBatchCurrentBooks(['bc-1', 'bc-2', 'bc-3']);
            expect(bookClubBooks_repository_1.BookClubBooksRepository.findCurrentByBookClubIds).toHaveBeenCalledWith(['bc-1', 'bc-2', 'bc-3']);
            expect(result).toEqual([
                { bookClubId: 'bc-1', currentBook: currentBooks[0] },
                { bookClubId: 'bc-2', currentBook: null },
                { bookClubId: 'bc-3', currentBook: currentBooks[1] },
            ]);
        });
        it('should return null for all if no current books', async () => {
            bookClubBooks_repository_1.BookClubBooksRepository.findCurrentByBookClubIds.mockResolvedValue([]);
            const result = await bookClubBooks_service_1.BookClubBooksService.getBatchCurrentBooks(['bc-1']);
            expect(result).toEqual([{ bookClubId: 'bc-1', currentBook: null }]);
        });
    });
});
