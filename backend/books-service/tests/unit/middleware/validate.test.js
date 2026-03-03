"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validate_1 = require("../../../src/middleware/validate");
const joi_1 = __importDefault(require("joi"));
const errors_1 = require("../../../src/utils/errors");
describe('validate middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    beforeEach(() => {
        mockNext = jest.fn();
        mockReq = { query: {}, params: {}, body: {} };
        mockRes = {};
    });
    describe('body validation', () => {
        const schema = joi_1.default.object({
            name: joi_1.default.string().required(),
            age: joi_1.default.number().min(1).optional(),
        });
        it('should call next() when body is valid', () => {
            mockReq.body = { name: 'Test', age: 25 };
            (0, validate_1.validate)({ body: schema })(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
        });
        it('should call next(ValidationError) when body is invalid', () => {
            mockReq.body = { age: -1 };
            (0, validate_1.validate)({ body: schema })(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.any(errors_1.ValidationError));
        });
        it('should replace req.body with validated value', () => {
            const schemaWithDefaults = joi_1.default.object({
                name: joi_1.default.string().required(),
                role: joi_1.default.string().default('user'),
            });
            mockReq.body = { name: 'Test' };
            (0, validate_1.validate)({ body: schemaWithDefaults })(mockReq, mockRes, mockNext);
            expect(mockReq.body).toEqual({ name: 'Test', role: 'user' });
        });
    });
    describe('params validation', () => {
        const schema = joi_1.default.object({
            id: joi_1.default.string().uuid().required(),
        });
        it('should call next() when params are valid', () => {
            mockReq.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
            (0, validate_1.validate)({ params: schema })(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
        });
        it('should call next(ValidationError) when params are invalid', () => {
            mockReq.params = { id: 'not-a-uuid' };
            (0, validate_1.validate)({ params: schema })(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.any(errors_1.ValidationError));
        });
        it('should allow unknown params (e.g. Express adds extra params)', () => {
            mockReq.params = { id: '550e8400-e29b-41d4-a716-446655440000', extra: 'value' };
            (0, validate_1.validate)({ params: schema })(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
        });
    });
    describe('query validation', () => {
        const schema = joi_1.default.object({
            page: joi_1.default.number().integer().min(1).optional().default(1),
            limit: joi_1.default.number().integer().min(1).max(100).optional().default(20),
        });
        it('should call next() when query is valid', () => {
            mockReq.query = { page: '2', limit: '10' };
            (0, validate_1.validate)({ query: schema })(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
        });
        it('should call next(ValidationError) when query is invalid', () => {
            mockReq.query = { page: '-1' };
            (0, validate_1.validate)({ query: schema })(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.any(errors_1.ValidationError));
        });
        it('should mutate query values in-place (Express 5 compatibility)', () => {
            // In Express 5 req.query is a read-only getter so we can't assign req.query = value
            // The middleware mutates properties in-place instead
            mockReq.query = {};
            (0, validate_1.validate)({ query: schema })(mockReq, mockRes, mockNext);
            // Defaults should be applied in-place
            expect(mockReq.query.page).toBe(1);
            expect(mockReq.query.limit).toBe(20);
        });
    });
    describe('combined validation', () => {
        it('should validate params, query, and body together', () => {
            const paramsSchema = joi_1.default.object({ id: joi_1.default.string().required() });
            const querySchema = joi_1.default.object({ page: joi_1.default.number().optional().default(1) });
            const bodySchema = joi_1.default.object({ name: joi_1.default.string().required() });
            mockReq.params = { id: 'abc' };
            mockReq.query = {};
            mockReq.body = { name: 'Test' };
            (0, validate_1.validate)({ params: paramsSchema, query: querySchema, body: bodySchema })(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
        });
        it('should fail on first validation error (params checked first)', () => {
            const paramsSchema = joi_1.default.object({ id: joi_1.default.string().uuid().required() });
            const bodySchema = joi_1.default.object({ name: joi_1.default.string().required() });
            mockReq.params = { id: 'invalid' };
            mockReq.body = {};
            (0, validate_1.validate)({ params: paramsSchema, body: bodySchema })(mockReq, mockRes, mockNext);
            // Should fail on params validation, not body
            expect(mockNext).toHaveBeenCalledWith(expect.any(errors_1.ValidationError));
            expect(mockNext).toHaveBeenCalledTimes(1);
        });
    });
});
