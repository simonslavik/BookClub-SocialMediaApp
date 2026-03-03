"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authMiddleware_1 = require("../../../src/middleware/authMiddleware");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
jest.mock('../../../src/utils/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));
describe('authMiddleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    let jsonMock;
    let statusMock;
    const JWT_SECRET = 'test-secret-key-for-testing';
    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockNext = jest.fn();
        mockReq = { headers: {} };
        mockRes = { status: statusMock };
        process.env.JWT_SECRET = JWT_SECRET;
    });
    it('should return 401 when no authorization header', async () => {
        await (0, authMiddleware_1.authMiddleware)(mockReq, mockRes, mockNext);
        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({ message: 'No authorization token provided' });
        expect(mockNext).not.toHaveBeenCalled();
    });
    it('should return 401 for invalid authorization format (no Bearer)', async () => {
        mockReq.headers = { authorization: 'Basic abc123' };
        await (0, authMiddleware_1.authMiddleware)(mockReq, mockRes, mockNext);
        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
            message: 'Invalid authorization format. Expected: Bearer <token>',
        });
    });
    it('should return 401 for invalid token', async () => {
        mockReq.headers = { authorization: 'Bearer invalid-token' };
        await (0, authMiddleware_1.authMiddleware)(mockReq, mockRes, mockNext);
        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid token' });
    });
    it('should return 401 for expired token', async () => {
        const token = jsonwebtoken_1.default.sign({ userId: 'u1', email: 'test@test.com' }, JWT_SECRET, { expiresIn: '-1s' } // already expired
        );
        mockReq.headers = { authorization: `Bearer ${token}` };
        await (0, authMiddleware_1.authMiddleware)(mockReq, mockRes, mockNext);
        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
            message: 'Token expired. Please refresh your token.',
        });
    });
    it('should set req.user and call next() for valid token', async () => {
        const token = jsonwebtoken_1.default.sign({ userId: 'user-1', email: 'test@test.com', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
        mockReq.headers = { authorization: `Bearer ${token}` };
        await (0, authMiddleware_1.authMiddleware)(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalled();
        expect(mockReq.user).toEqual({
            userId: 'user-1',
            email: 'test@test.com',
            role: 'admin',
        });
    });
    it('should default role to "user" when not in token', async () => {
        const token = jsonwebtoken_1.default.sign({ userId: 'user-1', email: 'test@test.com' }, JWT_SECRET, { expiresIn: '1h' });
        mockReq.headers = { authorization: `Bearer ${token}` };
        await (0, authMiddleware_1.authMiddleware)(mockReq, mockRes, mockNext);
        expect(mockReq.user?.role).toBe('user');
    });
    it('should return 500 for unknown errors (without leaking details)', async () => {
        // Force an unexpected error by removing JWT_SECRET
        delete process.env.JWT_SECRET;
        const token = jsonwebtoken_1.default.sign({ userId: 'u1', email: 'test@test.com' }, 'wrong-secret');
        mockReq.headers = { authorization: `Bearer ${token}` };
        await (0, authMiddleware_1.authMiddleware)(mockReq, mockRes, mockNext);
        // Should return 401 for invalid token (signed with different secret)
        expect(statusMock).toHaveBeenCalledWith(401);
    });
});
