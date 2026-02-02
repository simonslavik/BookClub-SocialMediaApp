import { Response } from 'express';
/**
 * Standard API Response Helpers
 * Provides consistent response formats across all endpoints
 */
export declare const HttpStatus: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly INTERNAL_SERVER_ERROR: 500;
};
export declare const sendSuccess: (res: Response, data?: any, message?: string) => Response<any, Record<string, any>>;
export declare const sendCreated: (res: Response, data?: any, message?: string) => Response<any, Record<string, any>>;
export declare const sendBadRequest: (res: Response, message?: string) => Response<any, Record<string, any>>;
export declare const sendUnauthorized: (res: Response, message?: string) => Response<any, Record<string, any>>;
export declare const sendForbidden: (res: Response, message?: string) => Response<any, Record<string, any>>;
export declare const sendNotFound: (res: Response, resource?: string) => Response<any, Record<string, any>>;
export declare const sendConflict: (res: Response, message: string) => Response<any, Record<string, any>>;
export declare const sendServerError: (res: Response, message?: string) => Response<any, Record<string, any>>;
export declare const sendPaginated: (res: Response, data: any[], page: number, limit: number, total: number) => Response<any, Record<string, any>>;
//# sourceMappingURL=responseHelpers.d.ts.map