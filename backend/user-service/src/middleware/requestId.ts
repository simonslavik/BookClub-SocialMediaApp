import { v4 as uuidv4 } from 'uuid';
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
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Get request ID from header or generate new one
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();
    
    // Attach to request object
    (req as any).id = requestId;
    
    // Add to response headers
    res.setHeader('X-Request-ID', requestId);
    
    next();
};
