"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandler_1 = __importDefault(require("../../../src/middleware/errorHandler"));
const errors_1 = require("../../../src/utils/errors");
const client_1 = require("@prisma/client");
jest.mock('../../../src/utils/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));
describe('errorHandler', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    let jsonMock;
    let statusMock;
    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockNext = jest.fn();
        mockReq = { url: '/test', method: 'GET' };
        mockRes = { status: statusMock };
    });
    describe('AppError handling', () => {
        it('should return 404 for NotFoundError', () => {
            const error = new errors_1.NotFoundError('Book');
            (0, errorHandler_1.default)(error, mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: 'Book not found',
            });
        });
        it('should return 400 for ValidationError', () => {
            const error = new errors_1.ValidationError('Invalid data');
            (0, errorHandler_1.default)(error, mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid data',
            });
        });
        it('should return 403 for ForbiddenError', () => {
            const error = new errors_1.ForbiddenError('Not allowed');
            (0, errorHandler_1.default)(error, mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: 'Not allowed',
            });
        });
        it('should return 409 for ConflictError', () => {
            const error = new errors_1.ConflictError('Already exists');
            (0, errorHandler_1.default)(error, mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(409);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: 'Already exists',
            });
        });
        it('should return custom status for generic AppError', () => {
            const error = new errors_1.AppError('Custom error', 422);
            (0, errorHandler_1.default)(error, mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(422);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: 'Custom error',
            });
        });
        it('should include NotFoundError id in message', () => {
            const error = new errors_1.NotFoundError('Suggestion', 'abc-123');
            (0, errorHandler_1.default)(error, mockReq, mockRes, mockNext);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: "Suggestion with id 'abc-123' not found",
            });
        });
    });
    describe('Prisma error handling', () => {
        it('should return 409 for P2002 (unique constraint)', () => {
            const error = new client_1.Prisma.PrismaClientKnownRequestError('Unique constraint', {
                code: 'P2002',
                clientVersion: '5.0.0',
            });
            (0, errorHandler_1.default)(error, mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(409);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: 'Resource already exists',
            });
        });
        it('should return 404 for P2025 (record not found)', () => {
            const error = new client_1.Prisma.PrismaClientKnownRequestError('Record not found', {
                code: 'P2025',
                clientVersion: '5.0.0',
            });
            (0, errorHandler_1.default)(error, mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: 'Resource not found',
            });
        });
        it('should return 500 for other Prisma error codes', () => {
            const error = new client_1.Prisma.PrismaClientKnownRequestError('Other error', {
                code: 'P2003',
                clientVersion: '5.0.0',
            });
            (0, errorHandler_1.default)(error, mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: 'Database operation failed',
            });
        });
        it('should return 400 for PrismaClientValidationError', () => {
            const error = new client_1.Prisma.PrismaClientValidationError('Validation failed', {
                clientVersion: '5.0.0',
            });
            (0, errorHandler_1.default)(error, mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid data provided',
            });
        });
    });
    describe('413 payload too large', () => {
        it('should handle entity too large by message', () => {
            const error = new Error('request entity too large');
            (0, errorHandler_1.default)(error, mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(413);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: 'Request body too large',
            });
        });
        it('should handle entity too large by type', () => {
            const error = new Error('payload too large');
            error.type = 'entity.too.large';
            (0, errorHandler_1.default)(error, mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(413);
        });
    });
    describe('Unknown errors', () => {
        it('should return 500 with generic message (never leaks error details)', () => {
            const error = new Error('Sensitive database connection string exposed');
            (0, errorHandler_1.default)(error, mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                error: 'Internal server error',
            });
        });
    });
});
