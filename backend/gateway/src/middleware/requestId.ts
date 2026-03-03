import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Add unique request ID to each request
 * Useful for tracing requests through logs
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  
  (req as any).id = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

export default requestId;
