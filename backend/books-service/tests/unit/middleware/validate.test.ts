import { Request, Response, NextFunction } from 'express';
import { validate } from '../../../src/middleware/validate';
import joi from 'joi';
import { ValidationError } from '../../../src/utils/errors';

describe('validate middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockNext = jest.fn();
    mockReq = { query: {}, params: {}, body: {} };
    mockRes = {} as Partial<Response>;
  });

  describe('body validation', () => {
    const schema = joi.object({
      name: joi.string().required(),
      age: joi.number().min(1).optional(),
    });

    it('should call next() when body is valid', () => {
      mockReq.body = { name: 'Test', age: 25 };

      validate({ body: schema })(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next(ValidationError) when body is invalid', () => {
      mockReq.body = { age: -1 };

      validate({ body: schema })(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should replace req.body with validated value', () => {
      const schemaWithDefaults = joi.object({
        name: joi.string().required(),
        role: joi.string().default('user'),
      });
      mockReq.body = { name: 'Test' };

      validate({ body: schemaWithDefaults })(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body).toEqual({ name: 'Test', role: 'user' });
    });
  });

  describe('params validation', () => {
    const schema = joi.object({
      id: joi.string().uuid().required(),
    });

    it('should call next() when params are valid', () => {
      mockReq.params = { id: '550e8400-e29b-41d4-a716-446655440000' };

      validate({ params: schema })(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next(ValidationError) when params are invalid', () => {
      mockReq.params = { id: 'not-a-uuid' };

      validate({ params: schema })(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should allow unknown params (e.g. Express adds extra params)', () => {
      mockReq.params = { id: '550e8400-e29b-41d4-a716-446655440000', extra: 'value' };

      validate({ params: schema })(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('query validation', () => {
    const schema = joi.object({
      page: joi.number().integer().min(1).optional().default(1),
      limit: joi.number().integer().min(1).max(100).optional().default(20),
    });

    it('should call next() when query is valid', () => {
      mockReq.query = { page: '2', limit: '10' };

      validate({ query: schema })(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next(ValidationError) when query is invalid', () => {
      mockReq.query = { page: '-1' };

      validate({ query: schema })(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should mutate query values in-place (Express 5 compatibility)', () => {
      // In Express 5 req.query is a read-only getter so we can't assign req.query = value
      // The middleware mutates properties in-place instead
      mockReq.query = {};

      validate({ query: schema })(mockReq as Request, mockRes as Response, mockNext);

      // Defaults should be applied in-place
      expect((mockReq.query as any).page).toBe(1);
      expect((mockReq.query as any).limit).toBe(20);
    });
  });

  describe('combined validation', () => {
    it('should validate params, query, and body together', () => {
      const paramsSchema = joi.object({ id: joi.string().required() });
      const querySchema = joi.object({ page: joi.number().optional().default(1) });
      const bodySchema = joi.object({ name: joi.string().required() });

      mockReq.params = { id: 'abc' };
      mockReq.query = {};
      mockReq.body = { name: 'Test' };

      validate({ params: paramsSchema, query: querySchema, body: bodySchema })(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should fail on first validation error (params checked first)', () => {
      const paramsSchema = joi.object({ id: joi.string().uuid().required() });
      const bodySchema = joi.object({ name: joi.string().required() });

      mockReq.params = { id: 'invalid' };
      mockReq.body = {};

      validate({ params: paramsSchema, body: bodySchema })(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Should fail on params validation, not body
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});
