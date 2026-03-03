"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const userBooksController_1 = require("../../../src/controllers/userBooksController");
const userBooks_service_1 = require("../../../src/services/userBooks.service");
jest.mock('../../../src/services/userBooks.service');
describe('UserBooksController', () => {
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
            params: {},
            body: {},
        };
        mockRes = { json: jsonMock };
        jest.clearAllMocks();
    });
    describe('getUserBooks', () => {
        it('should return paginated user books', async () => {
            const result = {
                data: [{ id: '1', status: 'reading' }],
                pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            };
            userBooks_service_1.UserBooksService.getUserBooks.mockResolvedValue(result);
            await (0, userBooksController_1.getUserBooks)(mockReq, mockRes, mockNext);
            expect(userBooks_service_1.UserBooksService.getUserBooks).toHaveBeenCalledWith('user-1', undefined, 1, 20);
            expect(jsonMock).toHaveBeenCalledWith({ success: true, ...result });
        });
        it('should pass status filter and pagination', async () => {
            mockReq.query = { status: 'reading', page: '3', limit: '5' };
            userBooks_service_1.UserBooksService.getUserBooks.mockResolvedValue({ data: [], pagination: {} });
            await (0, userBooksController_1.getUserBooks)(mockReq, mockRes, mockNext);
            expect(userBooks_service_1.UserBooksService.getUserBooks).toHaveBeenCalledWith('user-1', 'reading', 3, 5);
        });
        it('should call next(error) on failure', async () => {
            const error = new Error('fail');
            userBooks_service_1.UserBooksService.getUserBooks.mockRejectedValue(error);
            await (0, userBooksController_1.getUserBooks)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
            expect(jsonMock).not.toHaveBeenCalled();
        });
    });
    describe('addUserBook', () => {
        it('should add a book and return success', async () => {
            mockReq.body = { googleBooksId: 'g1', status: 'reading', rating: 4, review: 'good' };
            const userBook = { id: 'ub-1', status: 'reading', rating: 4 };
            userBooks_service_1.UserBooksService.addUserBook.mockResolvedValue(userBook);
            await (0, userBooksController_1.addUserBook)(mockReq, mockRes, mockNext);
            expect(userBooks_service_1.UserBooksService.addUserBook).toHaveBeenCalledWith('user-1', 'g1', 'reading', 4, 'good');
            expect(jsonMock).toHaveBeenCalledWith({ success: true, data: userBook });
        });
        it('should call next(error) on failure', async () => {
            mockReq.body = { googleBooksId: 'g1', status: 'reading' };
            const error = new Error('API error');
            userBooks_service_1.UserBooksService.addUserBook.mockRejectedValue(error);
            await (0, userBooksController_1.addUserBook)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('updateUserBook', () => {
        it('should update and return success', async () => {
            mockReq.params = { bookId: 'b1' };
            mockReq.body = { status: 'completed', rating: 5 };
            const updated = { id: 'ub-1', status: 'completed', rating: 5 };
            userBooks_service_1.UserBooksService.updateUserBook.mockResolvedValue(updated);
            await (0, userBooksController_1.updateUserBook)(mockReq, mockRes, mockNext);
            expect(userBooks_service_1.UserBooksService.updateUserBook).toHaveBeenCalledWith('user-1', 'b1', {
                status: 'completed',
                rating: 5,
                review: undefined,
            });
            expect(jsonMock).toHaveBeenCalledWith({ success: true, data: updated });
        });
        it('should call next(error) on failure', async () => {
            mockReq.params = { bookId: 'b1' };
            mockReq.body = { status: 'completed' };
            const error = new Error('not found');
            userBooks_service_1.UserBooksService.updateUserBook.mockRejectedValue(error);
            await (0, userBooksController_1.updateUserBook)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('deleteUserBook', () => {
        it('should delete and return success message', async () => {
            mockReq.params = { userBookId: 'ub-1' };
            userBooks_service_1.UserBooksService.deleteUserBookById.mockResolvedValue(undefined);
            await (0, userBooksController_1.deleteUserBook)(mockReq, mockRes, mockNext);
            expect(userBooks_service_1.UserBooksService.deleteUserBookById).toHaveBeenCalledWith('user-1', 'ub-1');
            expect(jsonMock).toHaveBeenCalledWith({ success: true, message: 'Book removed from library' });
        });
        it('should call next(error) on failure', async () => {
            mockReq.params = { userBookId: 'ub-1' };
            const error = new Error('not found');
            userBooks_service_1.UserBooksService.deleteUserBookById.mockRejectedValue(error);
            await (0, userBooksController_1.deleteUserBook)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
});
