import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { useContext, useEffect, useState } from 'react';
import { AuthProvider, AuthContext } from '../index';
import apiClient from '@api/axios';
import { server } from '@/test/server';

const API = 'http://localhost:3000';

// vitest 4's jsdom env ships a non-standard localStorage that lacks
// setItem/clear. Replace with an in-memory polyfill for these tests.
beforeAll(() => {
  const store = new Map<string, string>();
  const polyfill = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => { store.clear(); },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
  };
  Object.defineProperty(window, 'localStorage', {
    value: polyfill,
    configurable: true,
  });
});

const seedAuth = (auth: { user: any; token: string }) => {
  window.localStorage.setItem('auth', JSON.stringify(auth));
};

// Test consumer: triggers a protected API call and exposes the result/error.
// Waits one tick so the AuthProvider's response interceptor is registered
// before the request goes out — axios binds the interceptor chain at
// request-creation time.
const Consumer = ({ paths = ['/v1/me'] }: { paths?: string[] }) => {
  const { auth } = useContext(AuthContext);
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    const id = setTimeout(() => {
      Promise.all(
        paths.map((p) =>
          apiClient
            .get(p)
            .then((r) => `${p}:ok:${r.data.who}`)
            .catch((e) => `${p}:err:${e.response?.status ?? 'network'}`),
        ),
      ).then(setResults);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <div>
      <div data-testid="token">{auth.token ?? 'none'}</div>
      <div data-testid="results">{results.join('|')}</div>
    </div>
  );
};

const renderWithAuth = (ui: React.ReactElement) =>
  render(<AuthProvider>{ui}</AuthProvider>);

describe('AuthContext refresh interceptor (cookie-based refresh token)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('refreshes the token on 401 and retries the original request', async () => {
    seedAuth({ user: { id: 'u1', name: 'A', email: 'a@a.io' }, token: 'expired' });

    let callCount = 0;
    let refreshBodyWasEmpty = false;

    server.use(
      // Refresh: the body must be empty (the token rides in a cookie).
      // We can't observe HttpOnly cookies in MSW node land, so we just
      // verify the body is empty as a proxy.
      http.post(`${API}/v1/auth/refresh`, async ({ request }) => {
        const text = await request.text();
        refreshBodyWasEmpty = text === '' || text === '{}';
        return HttpResponse.json({ data: { accessToken: 'new-access' } });
      }),
      http.get(`${API}/v1/me`, ({ request }) => {
        callCount += 1;
        const auth = request.headers.get('authorization');
        if (auth === 'Bearer new-access') {
          return HttpResponse.json({ who: 'alice' });
        }
        return new HttpResponse(null, { status: 401 });
      }),
    );

    const { getByTestId } = renderWithAuth(<Consumer />);

    await waitFor(() => {
      expect(getByTestId('results').textContent).toBe('/v1/me:ok:alice');
    });
    expect(callCount).toBe(2); // initial 401 + retry with refreshed token
    expect(getByTestId('token').textContent).toBe('new-access');
    expect(refreshBodyWasEmpty).toBe(true);
  });

  it('coalesces concurrent 401s into a single refresh call (single-flight)', async () => {
    seedAuth({ user: { id: 'u1', name: 'A', email: 'a@a.io' }, token: 'expired' });

    let refreshCalls = 0;
    server.use(
      http.post(`${API}/v1/auth/refresh`, async () => {
        refreshCalls += 1;
        // Slight delay so the in-flight promise is shared across 3 callers
        await new Promise((r) => setTimeout(r, 20));
        return HttpResponse.json({ data: { accessToken: 'new-access' } });
      }),
      http.get(`${API}/v1/a`, ({ request }) =>
        request.headers.get('authorization') === 'Bearer new-access'
          ? HttpResponse.json({ who: 'a' })
          : new HttpResponse(null, { status: 401 }),
      ),
      http.get(`${API}/v1/b`, ({ request }) =>
        request.headers.get('authorization') === 'Bearer new-access'
          ? HttpResponse.json({ who: 'b' })
          : new HttpResponse(null, { status: 401 }),
      ),
      http.get(`${API}/v1/c`, ({ request }) =>
        request.headers.get('authorization') === 'Bearer new-access'
          ? HttpResponse.json({ who: 'c' })
          : new HttpResponse(null, { status: 401 }),
      ),
    );

    const { getByTestId } = renderWithAuth(<Consumer paths={['/v1/a', '/v1/b', '/v1/c']} />);

    await waitFor(() => {
      const t = getByTestId('results').textContent;
      expect(t).toContain('/v1/a:ok:a');
      expect(t).toContain('/v1/b:ok:b');
      expect(t).toContain('/v1/c:ok:c');
    });

    expect(refreshCalls).toBe(1);
  });

  it('logs the user out when the refresh call itself fails', async () => {
    seedAuth({ user: { id: 'u1', name: 'A', email: 'a@a.io' }, token: 'expired' });

    server.use(
      http.post(`${API}/v1/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
      http.get(`${API}/v1/me`, () => new HttpResponse(null, { status: 401 })),
    );

    const { getByTestId } = renderWithAuth(<Consumer />);

    await waitFor(() => {
      expect(getByTestId('results').textContent).toContain('err');
    });
    await waitFor(() => {
      expect(getByTestId('token').textContent).toBe('none');
    });
  });

  it('does not attempt refresh on 401 when no user is logged in', async () => {
    // No seedAuth — user is null
    let refreshCalls = 0;
    server.use(
      http.post(`${API}/v1/auth/refresh`, () => {
        refreshCalls += 1;
        return new HttpResponse(null, { status: 401 });
      }),
      http.get(`${API}/v1/public`, () => new HttpResponse(null, { status: 401 })),
    );

    const { getByTestId } = renderWithAuth(<Consumer paths={['/v1/public']} />);

    await waitFor(() => {
      expect(getByTestId('results').textContent).toContain('err:401');
    });
    expect(refreshCalls).toBe(0);
  });
});
