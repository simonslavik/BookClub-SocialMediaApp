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
};
// Success responses
export const sendSuccess = (res, data, message) => {
    return res.status(HttpStatus.OK).json({
        success: true,
        message: message || 'Success',
        ...(data && { data })
    });
};
export const sendCreated = (res, data, message) => {
    return res.status(HttpStatus.CREATED).json({
        success: true,
        message: message || 'Resource created successfully',
        ...(data && { data })
    });
};
// Error responses
export const sendBadRequest = (res, message = 'Bad request') => {
    return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message
    });
};
export const sendUnauthorized = (res, message = 'Unauthorized') => {
    return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message
    });
};
export const sendForbidden = (res, message = 'Forbidden') => {
    return res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message
    });
};
export const sendNotFound = (res, resource = 'Resource') => {
    return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: `${resource} not found`
    });
};
export const sendConflict = (res, message) => {
    return res.status(HttpStatus.CONFLICT).json({
        success: false,
        message
    });
};
export const sendServerError = (res, message = 'Internal server error') => {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message
    });
};
// Paginated response
export const sendPaginated = (res, data, page, limit, total) => {
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
//# sourceMappingURL=responseHelpers.js.map