import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';
import { ValidationError } from '../utils/errors.js';

/**
 * Middleware to validate request data against Zod schemas
 */
export const validate = (schema: ZodSchema, source: 'body' | 'params' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = source === 'body' ? req.body : source === 'params' ? req.params : req.query;
      schema.parse(data);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map((err: ZodIssue) => `${err.path.join('.')}: ${err.message}`);
        next(new ValidationError(messages.join(', ')));
      } else {
        next(error);
      }
    }
  };
};
