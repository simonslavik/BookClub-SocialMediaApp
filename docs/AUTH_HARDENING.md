# Auth Hardening — Shipped: HttpOnly cookie for refresh token

## Summary

Refresh tokens have been moved out of `localStorage` into an HttpOnly cookie.
JS can no longer read them, so an XSS no longer hands an attacker durable
account access — the worst they can do is steal the short-lived access token
that's currently in memory.

Migration shipped on this branch.

## What changed — backend ([backend/user-service](../backend/user-service))

- `cookie-parser` middleware mounted in [src/index.ts](../backend/user-service/src/index.ts).
- New helpers in [src/utils/cookieUtils.ts](../backend/user-service/src/utils/cookieUtils.ts):
  - `setRefreshCookie(res, token)` — `httpOnly`, `secure` (in prod), `sameSite=strict`, `path=/v1/auth`, 30 days.
  - `clearRefreshCookie(res)` — must use the same options to actually clear.
- [`registerUser`](../backend/user-service/src/controllers/userController.ts), `loginUser`, `googleAuth`:
  - Set `refresh_token` cookie via `setRefreshCookie`.
  - JSON body no longer contains `refreshToken` — only `{ user, accessToken }`.
- `refreshAccessToken`:
  - Reads token from `req.cookies.refresh_token` instead of `req.body.refreshToken`.
  - Rotates: revokes the old token, sets a new cookie with the new refresh token.
  - On invalid/expired token, calls `clearRefreshCookie` so the bad cookie stops returning.
  - Body returns only `{ accessToken }`.
- `logoutUser`:
  - Reads cookie, calls `clearRefreshCookie` unconditionally, best-effort revokes the DB record.
- Validation schemas `refreshTokenSchema` and `logoutSchema` now accept any body
  (the route still has `validateRequest` for symmetry with other auth routes).

## What changed — frontend ([frontend/src](../frontend/src))

- `AuthState` shrank from `{ user, token, refreshToken }` to `{ user, token }`
  ([context/index.tsx](../frontend/src/context/index.tsx)).
- The refresh interceptor:
  - Triggers on `401 + currentAuth.user` (the user-presence flag replaces the
    old refresh-token check, since we can't read the cookie from JS).
  - Calls `axios.post('/v1/auth/refresh', {}, { withCredentials: true })` —
    cookie travels automatically.
  - Single-flight refresh promise preserved.
- `loginModule` and `registerModule` switched from raw `axios` to `apiClient`
  so credentials/cookies travel on the same origin as subsequent API calls.
- `auth.api.ts` `refreshToken` and `logout` no longer take a body argument.
- `logout()` posts `/v1/auth/logout` so the server clears the cookie too.

## Tests

The integration suite covers the new behavior at
[src/context/__tests__/authRefresh.test.tsx](../frontend/src/context/__tests__/authRefresh.test.tsx):

- Refresh on 401 → retry succeeds with new access token, body of refresh call is empty.
- 3 concurrent 401s → 1 refresh call (single-flight preserved).
- Refresh failure → user is logged out (state cleared).
- 401 with no logged-in user → no refresh attempt is made.

## Things to verify in a real environment (not covered by unit tests)

1. **Same-site behavior in prod**: confirm frontend and gateway share a
   registrable domain so `SameSite=Strict` doesn't drop the cookie. If they
   don't (e.g. `app.example.com` vs `unrelated-api.com`), drop to
   `SameSite=Lax` or use a custom domain for the API.
2. **Gateway cookie passthrough**: `express-http-proxy` forwards `Cookie` and
   `Set-Cookie` headers by default; the gateway's `userResHeaderDecorator`
   only strips `access-control-*` headers, so `Set-Cookie` survives. Verify
   with `curl -v` against `/v1/auth/login` in staging.
3. **CORS credentials**: gateway and user-service both set `credentials: true`
   with a specific `origin`, not `*`. Confirmed in [gateway/src/index.ts](../backend/gateway/src/index.ts).
4. **Cookie path**: the cookie is scoped to `/v1/auth` so it only travels with
   auth-flow requests. If you ever move the auth routes, update the cookie
   path in [cookieUtils.ts](../backend/user-service/src/utils/cookieUtils.ts).
5. **Bootstrap on reload**: an open question — if a user reloads with
   `user` in localStorage but the access token has expired, the first
   protected request 401s and the interceptor refreshes. That works, but it
   means the first protected page-load has an extra round-trip. A small
   optimization is to call `/v1/auth/refresh` once on app boot when `user`
   exists, before any protected request fires. Not done yet.

## Related: known race in current interceptor registration

The response interceptor is registered inside `AuthProvider`'s `useEffect`.
Child effects run before parent effects on initial mount, so any `apiClient`
request fired from a child's mount-effect goes out before the refresh
interceptor is attached — and axios binds the response chain at
request-creation time, so that specific request won't get refresh-on-401.

In practice this rarely bites because most protected requests happen on
user interaction, not mount. But the right fix is to register the interceptor
at module load in `api/axios.ts` with a small module-level subscription
callback that `AuthProvider` updates with the current refresh handler.

The integration test in [authRefresh.test.tsx](../frontend/src/context/__tests__/authRefresh.test.tsx)
works around this with a one-tick delay before firing requests; that delay
should become unnecessary once the interceptor is registered at module load.
