/**
 * Base Application Error class
 * All custom errors should extend this class
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, statusCode: number, isOperational?: boolean);
}
/**
 * 404 Not Found Error
 * Use when a requested resource doesn't exist
 */
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
/**
 * 401 Unauthorized Error
 * Use when authentication is required but not provided or invalid
 */
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
/**
 * 403 Forbidden Error
 * Use when user is authenticated but doesn't have permission
 */
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
/**
 * 400 Bad Request Error
 * Use for general client-side errors (invalid input, etc.)
 */
export declare class BadRequestError extends AppError {
    constructor(message?: string);
}
/**
 * 409 Conflict Error
 * Use when request conflicts with current state (e.g., duplicate email)
 */
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
/**
 * 422 Validation Error
 * Use for validation failures (Zod/Joi validation errors)
 */
export declare class ValidationError extends AppError {
    readonly errors?: any;
    constructor(message?: string, errors?: any);
}
/**
 * 500 Internal Server Error
 * Use for unexpected server errors
 */
export declare class InternalServerError extends AppError {
    constructor(message?: string);
}
//# sourceMappingURL=errors.d.ts.map