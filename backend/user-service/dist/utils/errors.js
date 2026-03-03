/**
 * Base Application Error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        // Maintains proper stack trace for where our error was thrown
        Error.captureStackTrace(this, this.constructor);
        // Set the prototype explicitly to maintain instanceof checks
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
/**
 * 404 Not Found Error
 * Use when a requested resource doesn't exist
 */
export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
/**
 * 401 Unauthorized Error
 * Use when authentication is required but not provided or invalid
 */
export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
}
/**
 * 403 Forbidden Error
 * Use when user is authenticated but doesn't have permission
 */
export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
}
/**
 * 400 Bad Request Error
 * Use for general client-side errors (invalid input, etc.)
 */
export class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(message, 400);
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }
}
/**
 * 409 Conflict Error
 * Use when request conflicts with current state (e.g., duplicate email)
 */
export class ConflictError extends AppError {
    constructor(message = 'Conflict') {
        super(message, 409);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}
/**
 * 422 Validation Error
 * Use for validation failures (Zod/Joi validation errors)
 */
export class ValidationError extends AppError {
    errors;
    constructor(message = 'Validation failed', errors) {
        super(message, 422);
        this.errors = errors;
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
/**
 * 500 Internal Server Error
 * Use for unexpected server errors
 */
export class InternalServerError extends AppError {
    constructor(message = 'Internal server error') {
        super(message, 500, false); // Not operational - unexpected error
        Object.setPrototypeOf(this, InternalServerError.prototype);
    }
}
//# sourceMappingURL=errors.js.map