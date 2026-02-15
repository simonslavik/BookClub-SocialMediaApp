import { Request, Response, NextFunction } from 'express';

/**
 * Strips internal service-to-service headers from incoming client requests.
 * Prevents clients from spoofing trusted headers like x-user-id.
 * 
 * MUST run BEFORE auth middleware in the middleware chain.
 */
const stripInternalHeaders = (req: Request, _res: Response, next: NextFunction): void => {
  delete req.headers['x-user-id'];
  delete req.headers['x-user-email'];
  delete req.headers['x-user-name'];
  delete req.headers['x-user-role'];
  delete req.headers['x-gateway-source'];
  next();
};

export default stripInternalHeaders;
