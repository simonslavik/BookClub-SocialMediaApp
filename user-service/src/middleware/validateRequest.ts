import { Request, Response, NextFunction } from 'express';
import joi from 'joi';
import { logger } from '../utils/logger.js';

/**
 * Validation middleware factory
 * Creates middleware that validates request body, params, or query against a Joi schema
 */
export const validateRequest = (
  schema: joi.ObjectSchema, 
  source: 'body' | 'params' | 'query' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn({
        type: 'VALIDATION_ERROR',
        source,
        errors,
        path: req.path,
        method: req.method,
        userId: req.user?.userId
      });

      return res.status(400).json({
        message: 'Validation failed',
        errors
      });
    }

    // Replace request data with validated and sanitized data
    req[source] = value;
    next();
  };
};
