"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const userBooks_service_1 = require("../../../src/services/userBooks.service");
const userBooks_repository_1 = require("../../../src/repositories/userBooks.repository");
const books_repository_1 = require("../../../src/repositories/books.repository");
const googleBooks_service_1 = require("../../../src/services/googleBooks.service");
const errors_1 = require("../../../src/utils/errors");
jest.mock('../../../src/repositories/userBooks.repository');
jest.mock('../../../src/repositories/books.repository');
jest.mock('../../../src/services/googleBooks.service');
jest.mock('../../../src/utils/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));
describe('UserBooksService', () => {
    beforeEach(() => jest.clearAllMocks());
    describe('getUserBooks', () => {
        it('should return paginated results', async () => {
            const data = [{ id: '1', status: 'reading' }];
            userBooks_repository_1.UserBooksRepository.findByUserId.mockResolvedValue({ data, total: 1 });
            const result = await userBooks_service_1.UserBooksService.getUserBooks('user-1', undefined, 1, 20);
            expect(userBooks_repository_1.UserBooksRepository.findByUserId).toHaveBeenCalledWith('user-1', undefined, 0, 20);
            expect(result).toEqual({
                data,
                pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            });
        });
        it('should calculate skip from page and limit', async () => {
            userBooks_repository_1.UserBooksRepository.findByUserId.mockResolvedValue({ data: [], total: 0 });
            await userBooks_service_1.UserBooksService.getUserBooks('user-1', undefined, 3, 10);
            expect(userBooks_repository_1.UserBooksRepository.findByUserId).toHaveBeenCalledWith('user-1', undefined, 20, 10);
        });
        it('should pass status filter', async () => {
            userBooks_repository_1.UserBooksRepository.findByUserId.mockResolvedValue({ data: [], total: 0 });
            await userBooks_service_1.UserBooksService.getUserBooks('user-1', 'reading', 1, 20);
            expect(userBooks_repository_1.UserBooksRepository.findByUserId).toHaveBeenCalledWith('user-1', 'reading', 0, 20);
        });
        it('should calculate totalPages correctly', async () => {
            userBooks_repository_1.UserBooksRepository.findByUserId.mockResolvedValue({ data: [], total: 25 });
            const result = await userBooks_service_1.UserBooksService.getUserBooks('user-1', undefined, 1, 10);
            expect(result.pagination.totalPages).toBe(3);
        });
    });
    describe('addUserBook', () => {
        it('should fetch book data, upsert book, then upsert user book', async () => {
            const bookData = { googleBooksId: 'g1', title: 'Test' };
            const book = { id: 'b-1', ...bookData };
            const userBook = { id: 'ub-1', userId: 'user-1', bookId: 'b-1', status: 'reading' };
            googleBooks_service_1.GoogleBooksService.getBookById.mockResolvedValue(bookData);
            books_repository_1.BooksRepository.upsert.mockResolvedValue(book);
            userBooks_repository_1.UserBooksRepository.upsert.mockResolvedValue(userBook);
            const result = await userBooks_service_1.UserBooksService.addUserBook('user-1', 'g1', 'reading', 4, 'Good');
            expect(googleBooks_service_1.GoogleBooksService.getBookById).toHaveBeenCalledWith('g1');
            expect(books_repository_1.BooksRepository.upsert).toHaveBeenCalledWith('g1', bookData);
            expect(userBooks_repository_1.UserBooksRepository.upsert).toHaveBeenCalledWith('user-1', 'b-1', {
                status: 'reading',
                rating: 4,
                review: 'Good',
            });
            expect(result).toEqual(userBook);
        });
        it('should propagate Google Books API errors', async () => {
            googleBooks_service_1.GoogleBooksService.getBookById.mockRejectedValue(new Error('API fail'));
            await expect(userBooks_service_1.UserBooksService.addUserBook('user-1', 'g1', 'reading')).rejects.toThrow('API fail');
        });
    });
    describe('updateUserBook', () => {
        it('should update when book exists', async () => {
            const existing = { id: 'ub-1', userId: 'user-1', bookId: 'b-1' };
            const updated = { ...existing, status: 'completed' };
            userBooks_repository_1.UserBooksRepository.findOne.mockResolvedValue(existing);
            userBooks_repository_1.UserBooksRepository.update.mockResolvedValue(updated);
            const result = await userBooks_service_1.UserBooksService.updateUserBook('user-1', 'b-1', { status: 'completed' });
            expect(userBooks_repository_1.UserBooksRepository.findOne).toHaveBeenCalledWith('user-1', 'b-1');
            expect(userBooks_repository_1.UserBooksRepository.update).toHaveBeenCalledWith('user-1', 'b-1', { status: 'completed' });
            expect(result).toEqual(updated);
        });
        it('should throw NotFoundError when book does not exist', async () => {
            userBooks_repository_1.UserBooksRepository.findOne.mockResolvedValue(null);
            await expect(userBooks_service_1.UserBooksService.updateUserBook('user-1', 'b-1', { status: 'completed' })).rejects.toThrow(errors_1.NotFoundError);
        });
    });
    describe('deleteUserBook', () => {
        it('should delete when book exists', async () => {
            userBooks_repository_1.UserBooksRepository.findOne.mockResolvedValue({ id: 'ub-1' });
            userBooks_repository_1.UserBooksRepository.delete.mockResolvedValue(undefined);
            await userBooks_service_1.UserBooksService.deleteUserBook('user-1', 'b-1');
            expect(userBooks_repository_1.UserBooksRepository.delete).toHaveBeenCalledWith('user-1', 'b-1');
        });
        it('should throw NotFoundError when book does not exist', async () => {
            userBooks_repository_1.UserBooksRepository.findOne.mockResolvedValue(null);
            await expect(userBooks_service_1.UserBooksService.deleteUserBook('user-1', 'b-1')).rejects.toThrow(errors_1.NotFoundError);
        });
    });
    describe('deleteUserBookById', () => {
        it('should delete when book belongs to user', async () => {
            userBooks_repository_1.UserBooksRepository.findById.mockResolvedValue({ id: 'ub-1', userId: 'user-1' });
            userBooks_repository_1.UserBooksRepository.deleteById.mockResolvedValue(undefined);
            await userBooks_service_1.UserBooksService.deleteUserBookById('user-1', 'ub-1');
            expect(userBooks_repository_1.UserBooksRepository.deleteById).toHaveBeenCalledWith('ub-1');
        });
        it('should throw NotFoundError when not found', async () => {
            userBooks_repository_1.UserBooksRepository.findById.mockResolvedValue(null);
            await expect(userBooks_service_1.UserBooksService.deleteUserBookById('user-1', 'ub-1')).rejects.toThrow(errors_1.NotFoundError);
        });
        it('should throw ForbiddenError when book belongs to another user', async () => {
            userBooks_repository_1.UserBooksRepository.findById.mockResolvedValue({ id: 'ub-1', userId: 'other-user' });
            await expect(userBooks_service_1.UserBooksService.deleteUserBookById('user-1', 'ub-1')).rejects.toThrow(errors_1.ForbiddenError);
        });
    });
});
