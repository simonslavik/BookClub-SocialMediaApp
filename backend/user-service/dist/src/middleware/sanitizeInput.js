import xss from 'xss';
import { logger } from '../utils/logger.js';
/**
 * XSS Sanitization Middleware
 *
 * Defense-in-depth security layer that sanitizes HTML/script content
 * while Joi validates data format/types.
 *
 * Note: React auto-escapes output by default, but this provides:
 * 1. Protection if data is rendered as HTML elsewhere
 * 2. Defense against stored XSS in database
 * 3. Additional security layer for user-generated content
 */
const xssOptions = {
    whiteList: {}, // No HTML tags allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style']
};
/**
 * Recursively sanitize object properties
 */
const sanitizeObject = (obj, depth = 0) => {
    // Prevent deep recursion
    if (depth > 10)
        return obj;
    if (obj === null || obj === undefined)
        return obj;
    if (typeof obj === 'string') {
        return xss(obj, xssOptions);
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item, depth + 1));
    }
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                sanitized[key] = sanitizeObject(obj[key], depth + 1);
            }
        }
        return sanitized;
    }
    return obj;
};
/**
 * Middleware to sanitize request body, params, and query
 */
export const sanitizeInput = (req, res, next) => {
    try {
        let sanitized = false;
        if (req.body && Object.keys(req.body).length > 0) {
            const originalBody = JSON.stringify(req.body);
            req.body = sanitizeObject(req.body);
            const sanitizedBody = JSON.stringify(req.body);
            if (originalBody !== sanitizedBody) {
                sanitized = true;
                logger.warn({
                    type: 'XSS_SANITIZED',
                    path: req.path,
                    method: req.method,
                    userId: req.user?.userId,
                    ip: req.ip
                });
            }
        }
        if (req.query && Object.keys(req.query).length > 0) {
            req.query = sanitizeObject(req.query);
        }
        if (req.params && Object.keys(req.params).length > 0) {
            req.params = sanitizeObject(req.params);
        }
        next();
    }
    catch (error) {
        logger.error({
            type: 'SANITIZATION_ERROR',
            error: error.message,
            path: req.path
        });
        next(error);
    }
};
//# sourceMappingURL=sanitizeInput.js.map