import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';
/**
 * Rate limiter for authentication endpoints
 * Prevents brute force attacks on login/register
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res, next) => {
        logger.warn({
            type: 'RATE_LIMIT_EXCEEDED',
            ip: req.ip,
            path: req.path,
            userAgent: req.get('user-agent')
        });
        res.status(429).json({
            message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
        });
    }
});
/**
 * Rate limiter for general API endpoints
 * More lenient than auth limiter
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        logger.warn({
            type: 'RATE_LIMIT_EXCEEDED',
            ip: req.ip,
            path: req.path,
            userAgent: req.get('user-agent')
        });
        res.status(429).json({
            message: 'Too many requests from this IP, please try again later'
        });
    }
});
/**
 * Strict rate limiter for password reset
 * Very restrictive to prevent abuse
 */
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 password reset requests per hour
    message: 'Too many password reset attempts, please try again after 1 hour',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        logger.warn({
            type: 'RATE_LIMIT_EXCEEDED',
            action: 'PASSWORD_RESET',
            ip: req.ip,
            email: req.body.email
        });
        res.status(429).json({
            message: 'Too many password reset attempts, please try again after 1 hour'
        });
    }
});
//# sourceMappingURL=rateLimiter.js.map