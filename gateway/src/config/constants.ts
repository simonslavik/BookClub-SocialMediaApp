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
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
