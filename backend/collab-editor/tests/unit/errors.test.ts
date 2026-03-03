import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
  ValidationError,
} from '../../src/utils/errors';

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should create error with message and status code', () => {
      const error = new AppError('Something went wrong', 500);
      expect(error.message).toBe('Something went wrong');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should support non-operational errors', () => {
      const error = new AppError('Critical failure', 500, false);
      expect(error.isOperational).toBe(false);
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test', 400);
      expect(error.stack).toBeDefined();
    });
  });

  describe('NotFoundError', () => {
    it('should default to 404 with default message', () => {
      const error = new NotFoundError();
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
      expect(error).toBeInstanceOf(AppError);
    });

    it('should accept custom message', () => {
      const error = new NotFoundError('User not found');
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('UnauthorizedError', () => {
    it('should default to 401', () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized access');
    });
  });

  describe('ForbiddenError', () => {
    it('should default to 403', () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Access forbidden');
    });
  });

  describe('BadRequestError', () => {
    it('should default to 400', () => {
      const error = new BadRequestError();
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad request');
    });
  });

  describe('ConflictError', () => {
    it('should default to 409', () => {
      const error = new ConflictError();
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Resource conflict');
    });
  });

  describe('ValidationError', () => {
    it('should default to 422', () => {
      const error = new ValidationError();
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe('Validation failed');
    });

    it('should accept custom message', () => {
      const error = new ValidationError('name: Required, email: Invalid');
      expect(error.message).toBe('name: Required, email: Invalid');
      expect(error.statusCode).toBe(422);
    });
  });
});
