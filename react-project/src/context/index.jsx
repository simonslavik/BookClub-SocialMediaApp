import { createContext, useState, useEffect, useRef, useCallback } from "react";
import axios from 'axios';
import { API_URL } from '@config/constants';
import logger from '@utils/logger';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    // initialize from localStorage so auth persists across refresh
    const [auth, setAuthState] = useState(() => {
        try {
            const raw = localStorage.getItem('auth');
            return raw ? JSON.parse(raw) : { user: null, token: null, refreshToken: null };
        } catch (e) {
            return { user: null, token: null, refreshToken: null };
        }
    });

    // Keep a ref so the interceptor always reads the latest auth without re-registering
    const authRef = useRef(auth);
    authRef.current = auth;

    // helper to set auth both in state and localStorage
    const setAuth = useCallback((payload) => {
        const next = {
            user: payload?.user || null,
            token: payload?.token || null,
            refreshToken: payload?.refreshToken || null,
        };
        setAuthState(next);
        try {
            localStorage.setItem('auth', JSON.stringify(next));
        } catch (e) {
            // ignore
        }
        // apply axios default Authorization header
        if (next.token) axios.defaults.headers.common['Authorization'] = `Bearer ${next.token}`;
        else delete axios.defaults.headers.common['Authorization'];
    }, []);

    const logout = useCallback(() => {
        setAuth({ user: null, token: null, refreshToken: null });
    }, [setAuth]);

    useEffect(() => {
        // ensure axios has header if token exists on initial load
        if (auth?.token) axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
        else delete axios.defaults.headers.common['Authorization'];
    }, [auth?.token]);

    // Register interceptor ONCE (not on every auth change)
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                const currentAuth = authRef.current;

                if (error.response?.status === 401 && currentAuth?.refreshToken && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const { data } = await axios.post(`${API_URL}/v1/auth/refresh`, {
                            refreshToken: currentAuth.refreshToken
                        });

                        setAuth({
                            user: currentAuth.user,
                            token: data.accessToken,
                            refreshToken: data.refreshToken
                        });

                        originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
                        return axios(originalRequest);
                    } catch (refreshError) {
                        logger.error('Token refresh failed:', refreshError);
                        setAuth({ user: null, token: null, refreshToken: null });
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [setAuth]);

    return (
        <AuthContext.Provider value={{ auth, setAuth, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export { AuthContext };
export default AuthContext;