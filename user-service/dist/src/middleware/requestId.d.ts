import { Request, Response, NextFunction } from 'express';
/**
 * Request ID Middleware
 *
 * Adds a unique request ID to each request for distributed tracing.
 * The ID can be:
 * 1. Provided by the client via X-Request-ID header
 * 2. Auto-generated if not provided
 *
 * The ID is:
 * - Attached to the request object for logging
 * - Returned in the response headers
 * - Used for correlating logs across services
 */
export declare const requestIdMiddleware: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=requestId.d.ts.map