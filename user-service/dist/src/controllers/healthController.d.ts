import { Request, Response } from 'express';
/**
 * Basic health check endpoint
 * Returns service status and timestamp
 * GET /health
 */
export declare const healthCheck: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Readiness check endpoint for Kubernetes
 * Checks if service is ready to accept traffic
 * GET /health/ready
 */
export declare const readinessCheck: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Liveness check endpoint for Kubernetes
 * Checks if service process is alive and responding
 * GET /health/live
 */
export declare const livenessCheck: (req: Request, res: Response) => Response<any, Record<string, any>>;
//# sourceMappingURL=healthController.d.ts.map