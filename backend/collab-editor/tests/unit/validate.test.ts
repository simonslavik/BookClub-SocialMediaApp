import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../src/middleware/validate';
import { ValidationError } from '../../src/utils/errors';

const mockRequest = (body = {}, params = {}, query = {}): Partial<Request> => ({
  body,
  params: params as any,
  query: query as any,
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('validate middleware', () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive().optional(),
  });

  it('should call next for valid body data', () => {
    const middleware = validate(schema);
    const req = mockRequest({ name: 'John', age: 25 }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with ValidationError for invalid body', () => {
    const middleware = validate(schema);
    const req = mockRequest({ name: '' }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });

  it('should validate params source', () => {
    const paramSchema = z.object({
      id: z.string().uuid(),
    });
    const middleware = validate(paramSchema, 'params');
    const req = mockRequest({}, { id: '550e8400-e29b-41d4-a716-446655440000' }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should return error for invalid params', () => {
    const paramSchema = z.object({
      id: z.string().uuid(),
    });
    const middleware = validate(paramSchema, 'params');
    const req = mockRequest({}, { id: 'not-uuid' }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });

  it('should validate query source', () => {
    const querySchema = z.object({
      page: z.string().optional(),
    });
    const middleware = validate(querySchema, 'query');
    const req = mockRequest({}, {}, { page: '1' }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should include field path in error message', () => {
    const middleware = validate(schema);
    const req = mockRequest({ age: -5 }) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 422,
      })
    );
  });

  it('should forward non-ZodError to next', () => {
    // Create a schema that throws a non-Zod error
    const badSchema = {
      parse: () => { throw new Error('Unexpected error'); },
    } as any;
    const middleware = validate(badSchema);
    const req = mockRequest({}) as Request;
    const res = mockResponse() as Response;
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const err = next.mock.calls[0][0];
    expect(err.message).toBe('Unexpected error');
    expect(err).not.toBeInstanceOf(ValidationError);
  });
});
