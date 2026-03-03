import client from 'prom-client';
declare const register: client.Registry<"text/plain; version=0.0.4; charset=utf-8">;
export declare const httpRequestDuration: client.Histogram<"method" | "route" | "status_code">;
export declare const httpRequestTotal: client.Counter<"method" | "route" | "status_code">;
export declare const databaseQueryDuration: client.Histogram<"operation" | "model">;
export declare const authenticationAttempts: client.Counter<"type" | "result">;
export declare const activeUsers: client.Gauge<string>;
export declare const friendRequestsTotal: client.Counter<"action">;
export declare const directMessagesTotal: client.Counter<string>;
/**
 * Metrics endpoint handler
 * Returns Prometheus-formatted metrics
 */
export declare const getMetrics: () => Promise<string>;
/**
 * Middleware to track HTTP metrics
 */
export declare const metricsMiddleware: (req: any, res: any, next: any) => void;
export default register;
//# sourceMappingURL=metrics.d.ts.map