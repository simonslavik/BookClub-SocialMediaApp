import proxy from 'express-http-proxy';
import { Express, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import logger from '../utils/logger.js';
import authHandler from '../middleware/authHandler.js';
import { TIMEOUTS, HTTP_STATUS } from '../config/constants.js';

/**
 * Service route configuration
 */
interface ServiceConfig {
  envVar: string;
  route: string;
  name: string;
  requireAuth: boolean;
  pathTransform?: (path: string) => string;
}

/**
 * Proxy configuration interface
 */
interface ProxyConfig {
  proxyReqPathResolver: (req: Request) => string;
  proxyReqOptDecorator: (proxyReqOpts: any, srcReq: Request) => any;
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
  { envVar: 'USER_SERVICE_URL', route: '/v1/profile', name: 'Profile Service', requireAuth: false },
  { envVar: 'USER_SERVICE_URL', route: '/v1/users', name: 'User Service', requireAuth: true },
  { envVar: 'USER_SERVICE_URL', route: '/v1/friends', name: 'Friends Service', requireAuth: true },
  { envVar: 'USER_SERVICE_URL', route: '/v1/messages', name: 'Messages Service', requireAuth: true },
  
  // Collab Editor Service
  { 
    envVar: 'COLLAB_EDITOR_URL', 
    route: '/v1/editor', 
    name: 'Collab Editor Service', 
    requireAuth: false,
    pathTransform: (path: string) => path.replace(/^\/v1\/editor/, ''),
  },
  
  // Bookclubs - Routes to Collab Editor Service
  { 
    envVar: 'COLLAB_EDITOR_URL', 
    route: '/v1/bookclubs', 
    name: 'Bookclubs Service', 
    requireAuth: false, 
    pathTransform: (path: string) => path.replace(/^\/v1/, ''),
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
    requireAuth: false, 
    pathTransform: (path: string) => path,
  },
  { 
    envVar: 'BOOKS_SERVICE_URL', 
    route: '/v1/bookclub-books', 
    name: 'BookClub Book Progress Service', 
    requireAuth: true, 
    pathTransform: (path: string) => path,
  },
];

/**
 * Create proxy configuration for a service
 * @param serviceName - Name of the service for logging
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
    proxyReqOpts.headers['X-Service-Name'] = serviceName;

    // Forward user information if authenticated
    if (srcReq.user) {
      proxyReqOpts.headers['X-User-Id'] = (srcReq.user as any).userId;
      proxyReqOpts.headers['X-User-Email'] = (srcReq.user as any).email;
    }

    // Forward authorization header
    if (srcReq.headers.authorization) {
      proxyReqOpts.headers['Authorization'] = srcReq.headers.authorization;
    }

    logger.info(`[${requestId}] Proxying ${srcReq.method} ${srcReq.url} → ${serviceName}`);
    return proxyReqOpts;
  },

  /**
   * Decorate response from service
   */
  userResDecorator: (proxyRes: any, proxyResData: Buffer, userReq: Request) => {
    const requestId = (userReq as any).id || 'unknown';
    logger.info(`[${requestId}] ${serviceName} → ${proxyRes.statusCode}`);
    return proxyResData;
  },

  /**
   * Handle proxy errors
   */
  proxyErrorHandler: (err: Error, res: Response) => {
    logger.error(`Proxy error [${serviceName}]: ${err.message}`);
    
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      success: false,
      message: `${serviceName} is currently unavailable`,
      error: isProduction ? 'Service unavailable' : err.message,
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
    const middleware = requireAuth 
      ? [authHandler, proxy(serviceUrl, proxyConfig)]
      : [proxy(serviceUrl, proxyConfig)];

    app.use(route, ...middleware);

    const authStatus = requireAuth ? '🔒 protected' : '🌐 public';
    logger.info(`✓ ${authStatus}: ${route} → ${serviceUrl} [${name}]`);
  });
};
