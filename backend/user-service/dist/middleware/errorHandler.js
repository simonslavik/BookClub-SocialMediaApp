import logger from "../utils/logger.js";
import { AppError } from "../utils/errors.js";
const errorHandler = (err, req, res, next) => {
    // Log full error details
    logger.error({
        message: err.message,
        stack: err.stack,
        statusCode: err.statusCode || 500,
        isOperational: err.isOperational || false,
        requestId: req.id,
        path: req.path,
        method: req.method,
    });
    // Handle AppError instances
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: err.message,
            ...(err instanceof Error && { errors: err.errors }),
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        });
    }
    // Handle Prisma errors
    if (err.code === 'P2002') {
        return res.status(409).json({
            error: 'A record with this value already exists',
            ...(process.env.NODE_ENV === 'development' && { details: err.meta }),
        });
    }
    if (err.code === 'P2025') {
        return res.status(404).json({
            error: 'Record not found',
        });
    }
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
    }
    // Handle Validation errors (Joi/Zod)
    if (err.name === 'ValidationError' || err.details) {
        return res.status(422).json({
            error: 'Validation failed',
            details: err.details || err.message,
        });
    }
    // Default to 500 for unexpected errors
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(500).json({
        error: isDevelopment ? err.message : 'Internal server error',
        ...(isDevelopment && { stack: err.stack }),
    });
};
export default errorHandler;
//# sourceMappingURL=errorHandler.js.map