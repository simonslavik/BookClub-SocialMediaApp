"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bookClubBooksController_1 = require("../../../src/controllers/bookClubBooksController");
const bookClubBooks_service_1 = require("../../../src/services/bookClubBooks.service");
jest.mock('../../../src/services/bookClubBooks.service');
describe('BookClubBooksController', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    let jsonMock;
    beforeEach(() => {
        jsonMock = jest.fn();
        mockNext = jest.fn();
        mockReq = {
            user: { userId: 'user-1', email: 'test@test.com', role: 'user' },
            query: {},
            params: { bookClubId: 'bc-1' },
            body: {},
        };
        mockRes = { json: jsonMock };
        jest.clearAllMocks();
    });
    describe('getBookClubBooks', () => {
        it('should return paginated bookclub books', async () => {
            const result = {
                data: [{ id: '1' }],
                pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            };
            bookClubBooks_service_1.BookClubBooksService.getBookClubBooks.mockResolvedValue(result);
            await (0, bookClubBooksController_1.getBookClubBooks)(mockReq, mockRes, mockNext);
            expect(bookClubBooks_service_1.BookClubBooksService.getBookClubBooks).toHaveBeenCalledWith('bc-1', undefined, 1, 20);
            expect(jsonMock).toHaveBeenCalledWith({ success: true, ...result });
        });
        it('should pass status filter and pagination params', async () => {
            mockReq.query = { status: 'current', page: '2', limit: '10' };
            bookClubBooks_service_1.BookClubBooksService.getBookClubBooks.mockResolvedValue({ data: [], pagination: {} });
            await (0, bookClubBooksController_1.getBookClubBooks)(mockReq, mockRes, mockNext);
            expect(bookClubBooks_service_1.BookClubBooksService.getBookClubBooks).toHaveBeenCalledWith('bc-1', 'current', 2, 10);
        });
        it('should call next(error) on failure', async () => {
            const error = new Error('fail');
            bookClubBooks_service_1.BookClubBooksService.getBookClubBooks.mockRejectedValue(error);
            await (0, bookClubBooksController_1.getBookClubBooks)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('addBookClubBook', () => {
        it('should add book to bookclub', async () => {
            mockReq.body = { googleBooksId: 'g1', status: 'current', startDate: '2025-01-01', endDate: '2025-02-01' };
            const bookClubBook = { id: 'bcb-1', status: 'current' };
            bookClubBooks_service_1.BookClubBooksService.addBookClubBook.mockResolvedValue(bookClubBook);
            await (0, bookClubBooksController_1.addBookClubBook)(mockReq, mockRes, mockNext);
            expect(bookClubBooks_service_1.BookClubBooksService.addBookClubBook).toHaveBeenCalledWith('bc-1', 'user-1', 'g1', 'current', new Date('2025-01-01'), new Date('2025-02-01'));
            expect(jsonMock).toHaveBeenCalledWith({ success: true, data: bookClubBook });
        });
        it('should default status to upcoming', async () => {
            mockReq.body = { googleBooksId: 'g1' };
            bookClubBooks_service_1.BookClubBooksService.addBookClubBook.mockResolvedValue({});
            await (0, bookClubBooksController_1.addBookClubBook)(mockReq, mockRes, mockNext);
            expect(bookClubBooks_service_1.BookClubBooksService.addBookClubBook).toHaveBeenCalledWith('bc-1', 'user-1', 'g1', 'upcoming', undefined, undefined);
        });
        it('should call next(error) on failure', async () => {
            mockReq.body = { googleBooksId: 'g1' };
            const error = new Error('fail');
            bookClubBooks_service_1.BookClubBooksService.addBookClubBook.mockRejectedValue(error);
            await (0, bookClubBooksController_1.addBookClubBook)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('updateBookClubBook', () => {
        it('should update bookclub book', async () => {
            mockReq.params = { bookClubId: 'bc-1', bookId: 'b-1' };
            mockReq.body = { status: 'completed' };
            const updated = { id: 'bcb-1', status: 'completed' };
            bookClubBooks_service_1.BookClubBooksService.updateBookClubBook.mockResolvedValue(updated);
            await (0, bookClubBooksController_1.updateBookClubBook)(mockReq, mockRes, mockNext);
            expect(bookClubBooks_service_1.BookClubBooksService.updateBookClubBook).toHaveBeenCalledWith('bc-1', 'b-1', {
                status: 'completed',
                startDate: undefined,
                endDate: undefined,
            });
            expect(jsonMock).toHaveBeenCalledWith({ success: true, data: updated });
        });
        it('should call next(error) on failure', async () => {
            mockReq.params = { bookClubId: 'bc-1', bookId: 'b-1' };
            mockReq.body = { status: 'completed' };
            const error = new Error('not found');
            bookClubBooks_service_1.BookClubBooksService.updateBookClubBook.mockRejectedValue(error);
            await (0, bookClubBooksController_1.updateBookClubBook)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('deleteBookClubBook', () => {
        it('should delete and return success message', async () => {
            mockReq.params = { bookClubId: 'bc-1', bookId: 'b-1' };
            bookClubBooks_service_1.BookClubBooksService.deleteBookClubBook.mockResolvedValue(undefined);
            await (0, bookClubBooksController_1.deleteBookClubBook)(mockReq, mockRes, mockNext);
            expect(bookClubBooks_service_1.BookClubBooksService.deleteBookClubBook).toHaveBeenCalledWith('bc-1', 'b-1');
            expect(jsonMock).toHaveBeenCalledWith({ success: true, message: 'Book removed from bookclub' });
        });
        it('should call next(error) on failure', async () => {
            mockReq.params = { bookClubId: 'bc-1', bookId: 'b-1' };
            const error = new Error('not found');
            bookClubBooks_service_1.BookClubBooksService.deleteBookClubBook.mockRejectedValue(error);
            await (0, bookClubBooksController_1.deleteBookClubBook)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('getBatchCurrentBooks', () => {
        it('should return current books for multiple bookclubs', async () => {
            mockReq.body = { bookClubIds: ['bc-1', 'bc-2'] };
            const currentBooks = [
                { bookClubId: 'bc-1', currentBook: { id: 'bcb-1' } },
                { bookClubId: 'bc-2', currentBook: null },
            ];
            bookClubBooks_service_1.BookClubBooksService.getBatchCurrentBooks.mockResolvedValue(currentBooks);
            await (0, bookClubBooksController_1.getBatchCurrentBooks)(mockReq, mockRes, mockNext);
            expect(bookClubBooks_service_1.BookClubBooksService.getBatchCurrentBooks).toHaveBeenCalledWith(['bc-1', 'bc-2']);
            expect(jsonMock).toHaveBeenCalledWith({ success: true, currentBooks });
        });
        it('should call next(error) on failure', async () => {
            mockReq.body = { bookClubIds: ['bc-1'] };
            const error = new Error('fail');
            bookClubBooks_service_1.BookClubBooksService.getBatchCurrentBooks.mockRejectedValue(error);
            await (0, bookClubBooksController_1.getBatchCurrentBooks)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
});
