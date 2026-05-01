import { Response } from 'express';

/**
 * Refresh-token cookie name. Kept narrow on purpose: the cookie is only sent
 * to /v1/auth/* endpoints (gateway path) so it never leaks to other routes.
 */
export const REFRESH_COOKIE_NAME = 'refresh_token';

/**
 * 30 days in milliseconds — matches the refresh-token DB lifetime.
 */
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Path the cookie applies to. Matches the gateway path the browser sees.
 * The gateway proxies /v1/auth/* to the user-service, but the browser only
 * knows about /v1/auth.
 */
const REFRESH_COOKIE_PATH = '/v1/auth';

const baseCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: REFRESH_COOKIE_PATH,
});

export const setRefreshCookie = (res: Response, token: string): void => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
};

export const clearRefreshCookie = (res: Response): void => {
  // Match the same options used to set the cookie so the browser actually clears it.
  res.clearCookie(REFRESH_COOKIE_NAME, baseCookieOptions());
};
