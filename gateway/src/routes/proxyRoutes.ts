import proxy from 'express-http-proxy';
import { Express, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import logger from '../utils/logger.js';
import authHandler, { optionalAuth } from '../middleware/authHandler.js';
import { TIMEOUTS, HTTP_STATUS } from '../config/constants.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ALLOWED_ORIGINS = [FRONTEND_URL, 'http://localhost:5174', 'http://localhost:5173'];

/**
 * Service route configuration
 */
interface ServiceConfig {
  envVar: string;
  route: string;
  name: string;
  requireAuth: boolean | 'optional';
  pathTransform?: (path: string) => string;
}

/**
 * Proxy configuration interface
 */
interface ProxyConfig {
  proxyReqPathResolver: (req: Request) => string;
  proxyReqOptDecorator: (proxyReqOpts: any, srcReq: Request) => any;
  userResHeaderDecorator: (headers: import('http').IncomingHttpHeaders, userReq: Request, userRes: Response, proxyReq: any, proxyRes: any) => import('http').OutgoingHttpHeaders;
  userResDecorator: (proxyRes: any, proxyResData: Buffer, userReq: Request, userRes: Response) => Buffer;
  proxyErrorHandler: (err: Error, res: Response) => void;
  timeout: number;
}

/**
 * Service definitions
 */
const SERVICES: ServiceConfig[] = [
  // User Service routes
  { envVar: 'USER_SERVICE_URL', route: '/v1/auth', name: 'Auth Service', requireAuth: false },
  { envVar: 'USER_SERVICE_URL', route: '/v1/profile', name: 'Profile Service', requireAuth: 'optional' },
  { envVar: 'USER_SERVICE_URL', route: '/v1/users', name: 'User Service', requireAuth: true },
  { envVar: 'USER_SERVICE_URL', route: '/v1/friends', name: 'Friends Service', requireAuth: true },
  { envVar: 'USER_SERVICE_URL', route: '/v1/messages', name: 'Messages Service', requireAuth: true },
  
  // User Service static uploads (profile images)
  {
    envVar: 'USER_SERVICE_URL',
    route: '/user-uploads',
    name: 'User Uploads',
    requireAuth: false,
    pathTransform: (path: string) => path.replace(/^\/user-uploads/, '/uploads'),
  },

  // Collab Editor Service
  { 
    envVar: 'COLLAB_EDITOR_URL', 
    route: '/v1/editor', 
    name: 'Collab Editor Service', 
    requireAuth: 'optional',
    pathTransform: (path: string) => path.replace(/^\/v1\/editor/, ''),
  },
  
  // Bookclubs - Routes to Collab Editor Service
  { 
    envVar: 'COLLAB_EDITOR_URL', 
    route: '/v1/bookclubs', 
    name: 'Bookclubs Service', 
    requireAuth: 'optional', 
    pathTransform: (path: string) => path.replace(/^\/v1/, ''),
  },
  
  // Invites - Routes to Collab Editor Service
  { 
    envVar: 'COLLAB_EDITOR_URL', 
    route: '/v1/invites', 
    name: 'Invites Service', 
    requireAuth: 'optional', 
    pathTransform: (path: string) => path.replace(/^\/v1/, ''),
  },
  
  // Moderation - Routes to Collab Editor Service
  { 
    envVar: 'COLLAB_EDITOR_URL', 
    route: '/moderation', 
    name: 'Moderation Service', 
    requireAuth: true, 
    pathTransform: (path: string) => path,
  },
  
  // Upload - Routes to Collab Editor Service
  { 
    envVar: 'COLLAB_EDITOR_URL', 
    route: '/upload', 
    name: 'Upload Service', 
    requireAuth: true, 
    pathTransform: (path: string) => path,
  },
  
  // Books Service routes
  { 
    envVar: 'BOOKS_SERVICE_URL', 
    route: '/v1/books', 
    name: 'Books Service', 
    requireAuth: false, 
    pathTransform: (path: string) => path,
  },
  { 
    envVar: 'BOOKS_SERVICE_URL', 
    route: '/v1/user-books', 
    name: 'User Books Service', 
    requireAuth: true, 
    pathTransform: (path: string) => path,
  },
  { 
    envVar: 'BOOKS_SERVICE_URL', 
    route: '/v1/bookclub', 
    name: 'BookClub Book Service', 
    requireAuth: 'optional', 
    pathTransform: (path: string) => path,
  },
  { 
    envVar: 'BOOKS_SERVICE_URL', 
    route: '/v1/bookclub-books', 
    name: 'BookClub Book Progress Service', 
    requireAuth: true, 
    pathTransform: (path: string) => path,
  },

  // Notification Service routes
  { 
    envVar: 'NOTIFICATION_SERVICE_URL', 
    route: '/v1/notifications', 
    name: 'Notification Service', 
    requireAuth: true, 
    pathTransform: (path: string) => path.replace(/^\/v1\/notifications/, '/notifications'),
  },
];

/**
 * Create proxy configuration for a service
 * @param serviceName - Name of the service (used for server-side logging only)
 * @param pathTransform - Optional function to transform the request path
 */
const createProxyConfig = (
  serviceName: string, 
  pathTransform?: (path: string) => string
): ProxyConfig => ({
  /**
   * Resolve the path to forward to the service
   */
  proxyReqPathResolver: (req: Request) => {
    if (pathTransform) {
      return pathTransform(req.originalUrl);
    }
    // Default: Transform /v1/users -> /api/users
    return req.originalUrl.replace(/^\/v1/, '/api');
  },

  /**
   * Decorate proxy request with headers
   */
  proxyReqOptDecorator: (proxyReqOpts: any, srcReq: Request) => {
    const requestId = (srcReq as any).id || randomUUID();

    // Add gateway tracking headers
    proxyReqOpts.headers['X-Gateway-Source'] = 'api-gateway';
    proxyReqOpts.headers['X-Request-ID'] = requestId;
    proxyReqOpts.headers['X-Forwarded-For'] = srcReq.ip;

    // Forward user information if authenticated
    if (srcReq.user) {
      proxyReqOpts.headers['X-User-Id'] = (srcReq.user as any).userId;
      proxyReqOpts.headers['X-User-Email'] = (srcReq.user as any).email;
      if ((srcReq.user as any).name) {
        proxyReqOpts.headers['X-User-Name'] = (srcReq.user as any).name;
      }
    }

    // Forward authorization header
    if (srcReq.headers.authorization) {
      proxyReqOpts.headers['Authorization'] = srcReq.headers.authorization;
    }

    logger.debug(`[${requestId}] Proxying ${srcReq.method} ${srcReq.url} → ${serviceName}`);
    return proxyReqOpts;
  },

  /**
   * Strip CORS headers from downstream service responses.
   * The gateway's own CORS middleware (in index.ts) handles CORS for all client responses.
   * Without this, downstream services (e.g. books-service) can leak `Access-Control-Allow-Origin: *`
   * which conflicts with the client's `withCredentials: true`.
   */
  userResHeaderDecorator: (headers: import('http').IncomingHttpHeaders, userReq: Request) => {
    const corsPrefix = 'access-control-';
    const filtered: import('http').OutgoingHttpHeaders = {};

    // Keep all non-CORS headers from the downstream service
    for (const [key, value] of Object.entries(headers)) {
      if (!key.toLowerCase().startsWith(corsPrefix)) {
        filtered[key] = value;
      }
    }

    // Re-apply CORS headers using the same allowed origins as the gateway's cors() middleware
    const requestOrigin = userReq.headers.origin;
    if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) {
      filtered['access-control-allow-origin'] = requestOrigin;
      filtered['access-control-allow-credentials'] = 'true';
    }

    return filtered;
  },

  /**
   * Decorate response from service
   */
  userResDecorator: (proxyRes: any, proxyResData: Buffer, userReq: Request) => {
    const requestId = (userReq as any).id || 'unknown';
    const statusCode = proxyRes.statusCode;

    // Only log non-2xx responses at info level
    if (statusCode >= 400) {
      logger.warn(`[${requestId}] ${serviceName} → ${statusCode} ${userReq.method} ${userReq.url}`);
    } else {
      logger.debug(`[${requestId}] ${serviceName} → ${statusCode}`);
    }

    return proxyResData;
  },

  /**
   * Handle proxy errors — never leak service names to clients
   */
  proxyErrorHandler: (err: Error & { code?: string }, res: Response) => {
    logger.error(`Proxy error [${serviceName}]: ${err.message}`, { code: err.code });
    
    // Map known network errors to appropriate status codes
    if (err.code === 'ETIMEDOUT') {
      res.status(HTTP_STATUS.GATEWAY_TIMEOUT).json({
        success: false,
        message: 'Service request timed out',
      });
      return;
    }

    res.status(HTTP_STATUS.BAD_GATEWAY).json({
      success: false,
      message: 'Service temporarily unavailable',
    });
  },

  timeout: TIMEOUTS.DEFAULT,
});

/**
 * Setup proxy routes for all microservices
 * @param app - Express application instance
 */
export const setupProxyRoutes = (app: Express): void => {
  SERVICES.forEach(({ envVar, route, name, requireAuth, pathTransform }) => {
    const serviceUrl = process.env[envVar];

    if (!serviceUrl) {
      logger.warn(`⚠️  ${envVar} not configured, skipping ${name}`);
      return;
    }

    const proxyConfig = createProxyConfig(name, pathTransform);
    let middleware;
    if (requireAuth === true) {
      middleware = [authHandler, proxy(serviceUrl, proxyConfig)];
    } else if (requireAuth === 'optional') {
      middleware = [optionalAuth, proxy(serviceUrl, proxyConfig)];
    } else {
      middleware = [proxy(serviceUrl, proxyConfig)];
    }

    app.use(route, ...middleware);

    const authStatus = requireAuth === true ? '🔒 protected' : requireAuth === 'optional' ? '🔓 optional' : '🌐 public';
    logger.info(`✓ ${authStatus}: ${route} → ${serviceUrl} [${name}]`);
  });
};
