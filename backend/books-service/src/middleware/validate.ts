import { Request, Response, NextFunction } from 'express';
import joi from 'joi';
import { ValidationError } from '../utils/errors';

/**
 * Express middleware factory for Joi validation.
 * Validates req.body against bodySchema and req.params against paramsSchema.
 * On failure throws ValidationError which is caught by the centralized error handler.
 *
 * @param options.body    - Joi schema for request body
 * @param options.params  - Joi schema for request params
 * @param options.query   - Joi schema for query string
 */
export const validate = (options: {
  body?: joi.ObjectSchema;
  params?: joi.ObjectSchema;
  query?: joi.ObjectSchema;
}) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (options.params) {
      const { error } = options.params.validate(req.params, { allowUnknown: true });
      if (error) {
        return next(new ValidationError(error.details[0].message));
      }
    }

    if (options.query) {
      const { error, value } = options.query.validate(req.query, { allowUnknown: true });
      if (error) {
        return next(new ValidationError(error.details[0].message));
      }
      // Express 5: req.query is a read-only getter, so mutate in-place
      for (const key of Object.keys(value)) {
        (req.query as Record<string, unknown>)[key] = value[key];
      }
    }

    if (options.body) {
      const { error, value } = options.body.validate(req.body);
      if (error) {
        return next(new ValidationError(error.details[0].message));
      }
      req.body = value;
    }

    next();
  };
};
