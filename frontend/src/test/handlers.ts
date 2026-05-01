import { http, HttpResponse } from 'msw';

const API = 'http://localhost:3000';

export const handlers = [
  // Default refresh endpoint — tests can override per-case via server.use().
  // Refresh tokens now ride as HttpOnly cookies set by the server, so the
  // body only contains the new access token.
  http.post(`${API}/v1/auth/refresh`, () =>
    HttpResponse.json({ data: { accessToken: 'new-access' } }),
  ),
];
