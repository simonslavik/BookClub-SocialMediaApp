import { createContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from 'axios';
import apiClient from '@api/axios';
import { API_URL } from '@config/constants';
import logger from '@utils/logger';
import { clearCache } from '@utils/apiCache';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
  role?: string;
  emailVerified?: boolean;
  authProvider?: 'local' | 'google';
}

// The refresh token lives in an HttpOnly cookie set by the backend, never in
// JS-readable storage. This shape only tracks the in-memory access token and
// the user record.
export interface AuthState {
  user: AuthUser | null;
  token: string | null;
}

interface AuthContextValue {
  auth: AuthState;
  setAuth: (payload: Partial<AuthState>) => void;
  logout: () => void;
}

const EMPTY: AuthState = { user: null, token: null };

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export const AuthProvider = ({ children }) => {
    // initialize from localStorage so auth persists across refresh
    const [auth, setAuthState] = useState<AuthState>(() => {
        try {
            const raw = localStorage.getItem('auth');
            const parsed = raw ? JSON.parse(raw) : null;
            return parsed ? { user: parsed.user ?? null, token: parsed.token ?? null } : EMPTY;
        } catch (e) {
            return EMPTY;
        }
    });

    // Keep a ref so the interceptor always reads the latest auth without re-registering
    const authRef = useRef(auth);
    authRef.current = auth;

    // Single-flight refresh — multiple concurrent 401s share one refresh call
    const refreshPromiseRef = useRef<Promise<string> | null>(null);

    // helper to set auth both in state and localStorage
    const setAuth = useCallback((payload: Partial<AuthState>) => {
        const next: AuthState = {
            user: payload?.user ?? null,
            token: payload?.token ?? null,
        };
        setAuthState(next);
        try {
            localStorage.setItem('auth', JSON.stringify(next));
        } catch (e) {
            // ignore
        }
        if (next.token) axios.defaults.headers.common['Authorization'] = `Bearer ${next.token}`;
        else delete axios.defaults.headers.common['Authorization'];
    }, []);

    const logout = useCallback(() => {
        clearCache();
        // Best-effort cookie clear on the server; ignore failures (cookie still
        // gets blown away client-side via setAuth → state reset).
        apiClient.post('/v1/auth/logout').catch(() => {});
        setAuth(EMPTY);
    }, [setAuth]);

    useEffect(() => {
        if (auth?.token) axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
        else delete axios.defaults.headers.common['Authorization'];
    }, [auth?.token]);

    // Register interceptor on apiClient (the instance all API calls use) — ONCE
    useEffect(() => {
        const interceptor = apiClient.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                const currentAuth = authRef.current;

                // We attempt refresh whenever a logged-in user gets a 401.
                // The refresh token lives in an HttpOnly cookie, so we can't
                // detect its presence directly — we use `user` as the signal
                // that the user intended to be authenticated.
                if (error.response?.status === 401 && currentAuth?.user && !originalRequest._retry) {
                    originalRequest._retry = true;

                    if (!refreshPromiseRef.current) {
                        refreshPromiseRef.current = axios
                            .post(
                                `${API_URL}/v1/auth/refresh`,
                                {},
                                { withCredentials: true },
                            )
                            .then(({ data }) => {
                                const accessToken = data?.data?.accessToken ?? data?.accessToken;
                                if (!accessToken) {
                                    throw new Error('Refresh response missing accessToken');
                                }
                                setAuth({
                                    user: authRef.current.user,
                                    token: accessToken,
                                });
                                return accessToken as string;
                            })
                            .finally(() => {
                                refreshPromiseRef.current = null;
                            });
                    }

                    try {
                        const newToken = await refreshPromiseRef.current;
                        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                        return apiClient(originalRequest);
                    } catch (refreshError) {
                        logger.error('Token refresh failed:', refreshError);
                        setAuth(EMPTY);
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );

        return () => {
            apiClient.interceptors.response.eject(interceptor);
        };
    }, [setAuth]);

    const value = useMemo(() => ({ auth, setAuth, logout }), [auth, setAuth, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export { AuthContext };
export default AuthContext;
