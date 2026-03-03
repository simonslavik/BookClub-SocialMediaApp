import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
  ValidationError,
  InternalServerError,
} from '../../../src/utils/errors.js';

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with message and statusCode', () => {
      const error = new AppError('Something went wrong', 500);
      expect(error.message).toBe('Something went wrong');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should default isOperational to true', () => {
      const error = new AppError('test', 400);
      expect(error.isOperational).toBe(true);
    });

    it('should allow isOperational to be set to false', () => {
      const error = new AppError('test', 500, false);
      expect(error.isOperational).toBe(false);
    });

    it('should capture stack trace', () => {
      const error = new AppError('test', 400);
      expect(error.stack).toBeDefined();
    });

    it('should pass instanceof checks', () => {
      const error = new AppError('test', 400);
      expect(error instanceof AppError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('NotFoundError', () => {
    it('should create with default message', () => {
      const error = new NotFoundError();
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
    });

    it('should accept custom message', () => {
      const error = new NotFoundError('User not found');
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });

    it('should pass instanceof checks', () => {
      const error = new NotFoundError();
      expect(error instanceof NotFoundError).toBe(true);
      expect(error instanceof AppError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create with default message', () => {
      const error = new UnauthorizedError();
      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(401);
    });

    it('should accept custom message', () => {
      const error = new UnauthorizedError('Invalid token');
      expect(error.message).toBe('Invalid token');
    });

    it('should pass instanceof checks', () => {
      const error = new UnauthorizedError();
      expect(error instanceof UnauthorizedError).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });
  });

  describe('ForbiddenError', () => {
    it('should create with default message', () => {
      const error = new ForbiddenError();
      expect(error.message).toBe('Forbidden');
      expect(error.statusCode).toBe(403);
    });

    it('should accept custom message', () => {
      const error = new ForbiddenError('Access denied');
      expect(error.message).toBe('Access denied');
    });

    it('should pass instanceof checks', () => {
      const error = new ForbiddenError();
      expect(error instanceof ForbiddenError).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });
  });

  describe('BadRequestError', () => {
    it('should create with default message', () => {
      const error = new BadRequestError();
      expect(error.message).toBe('Bad request');
      expect(error.statusCode).toBe(400);
    });

    it('should accept custom message', () => {
      const error = new BadRequestError('Invalid input');
      expect(error.message).toBe('Invalid input');
    });

    it('should pass instanceof checks', () => {
      const error = new BadRequestError();
      expect(error instanceof BadRequestError).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });
  });

  describe('ConflictError', () => {
    it('should create with default message', () => {
      const error = new ConflictError();
      expect(error.message).toBe('Conflict');
      expect(error.statusCode).toBe(409);
    });

    it('should accept custom message', () => {
      const error = new ConflictError('Email already in use');
      expect(error.message).toBe('Email already in use');
    });

    it('should pass instanceof checks', () => {
      const error = new ConflictError();
      expect(error instanceof ConflictError).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('should create with default message', () => {
      const error = new ValidationError();
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(422);
      expect(error.errors).toBeUndefined();
    });

    it('should accept custom message and errors', () => {
      const errors = [{ field: 'email', message: 'Invalid email' }];
      const error = new ValidationError('Validation failed', errors);
      expect(error.message).toBe('Validation failed');
      expect(error.errors).toEqual(errors);
    });

    it('should pass instanceof checks', () => {
      const error = new ValidationError();
      expect(error instanceof ValidationError).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });
  });

  describe('InternalServerError', () => {
    it('should create with default message', () => {
      const error = new InternalServerError();
      expect(error.message).toBe('Internal server error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(false);
    });

    it('should accept custom message', () => {
      const error = new InternalServerError('Database connection failed');
      expect(error.message).toBe('Database connection failed');
      expect(error.isOperational).toBe(false);
    });

    it('should pass instanceof checks', () => {
      const error = new InternalServerError();
      expect(error instanceof InternalServerError).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });
  });
});
