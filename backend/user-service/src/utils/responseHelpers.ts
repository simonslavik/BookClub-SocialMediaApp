import { Response } from 'express';

/**
 * Standard API Response Helpers
 * Provides consistent response formats across all endpoints
 */

// HTTP Status Codes (for better readability)
export const HttpStatus = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
} as const;

// Success responses
export const sendSuccess = (res: Response, data?: any, message?: string) => {
    return res.status(HttpStatus.OK).json({
        success: true,
        message: message || 'Success',
        ...(data && { data })
    });
};

export const sendCreated = (res: Response, data?: any, message?: string) => {
    return res.status(HttpStatus.CREATED).json({
        success: true,
        message: message || 'Resource created successfully',
        ...(data && { data })
    });
};

// Error responses
export const sendBadRequest = (res: Response, message: string = 'Bad request') => {
    return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message
    });
};

export const sendUnauthorized = (res: Response, message: string = 'Unauthorized') => {
    return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message
    });
};

export const sendForbidden = (res: Response, message: string = 'Forbidden') => {
    return res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message
    });
};

export const sendNotFound = (res: Response, resource: string = 'Resource') => {
    return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: `${resource} not found`
    });
};

export const sendConflict = (res: Response, message: string) => {
    return res.status(HttpStatus.CONFLICT).json({
        success: false,
        message
    });
};

export const sendServerError = (res: Response, message: string = 'Internal server error') => {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message
    });
};

// Paginated response
export const sendPaginated = (
    res: Response,
    data: any[],
    page: number,
    limit: number,
    total: number
) => {
    const totalPages = Math.ceil(total / limit);
    
    return res.status(HttpStatus.OK).json({
        success: true,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasMore: page < totalPages,
            hasPrevious: page > 1
        }
    });
};
