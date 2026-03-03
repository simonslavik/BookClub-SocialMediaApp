/**
 * Application-wide constants
 */

export const TIMEOUTS = {
  DEFAULT: 10000,      // 10 seconds
  UPLOAD: 60000,       // 60 seconds
  HEAVY: 120000,       // 2 minutes
} as const;

export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000,  // 15 minutes
  MAX_REQUESTS: 1000,          // Maximum requests per window
} as const;

/**
 * Stricter rate limit for auth endpoints (login, register)
 * Prevents brute-force and credential-stuffing attacks
 */
export const AUTH_RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000,  // 15 minutes
  MAX_REQUESTS: 20,            // Much stricter than general limit
} as const;

export const BODY_LIMITS = {
  JSON: '2mb',
  URL_ENCODED: '2mb',
  UPLOAD: '10mb',
} as const;

export const SENSITIVE_FIELDS = [
  'password',
  'creditCard',
  'token',
  'secret',
  'apiKey',
] as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TIMEOUT: 408,
  PAYLOAD_TOO_LARGE: 413,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;
