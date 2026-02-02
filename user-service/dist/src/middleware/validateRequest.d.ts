import { Request, Response, NextFunction } from 'express';
import joi from 'joi';
/**
 * Validation middleware factory
 * Creates middleware that validates request body, params, or query against a Joi schema
 */
export declare const validateRequest: (schema: joi.ObjectSchema, source?: "body" | "params" | "query") => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=validateRequest.d.ts.map