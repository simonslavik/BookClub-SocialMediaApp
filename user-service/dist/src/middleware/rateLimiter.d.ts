/**
 * Rate limiter for authentication endpoints
 * Prevents brute force attacks on login/register
 */
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Rate limiter for general API endpoints
 * More lenient than auth limiter
 */
export declare const apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Strict rate limiter for password reset
 * Very restrictive to prevent abuse
 */
export declare const passwordResetLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map