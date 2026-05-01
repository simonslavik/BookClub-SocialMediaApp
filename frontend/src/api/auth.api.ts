import apiClient from './axios';

export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await apiClient.post('/v1/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (email, password) => {
    const response = await apiClient.post('/v1/auth/login', { email, password });
    return response.data;
  },

  // Google OAuth login
  googleLogin: async (credential) => {
    const response = await apiClient.post('/v1/auth/google', { credential });
    return response.data;
  },

  // Refresh access token — the refresh token rides as an HttpOnly cookie,
  // so no body argument is needed (or accepted).
  refreshToken: async () => {
    const response = await apiClient.post('/v1/auth/refresh');
    return response.data;
  },

  // Logout — the cookie identifies the session; no body needed.
  logout: async () => {
    const response = await apiClient.post('/v1/auth/logout');
    return response.data;
  },

  // Verify token
  verifyToken: async () => {
    const response = await apiClient.get('/v1/auth/verify');
    return response.data;
  },

  // Forgot password - request reset token
  forgotPassword: async (email) => {
    const response = await apiClient.post('/v1/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password with token
  resetPassword: async (token, password) => {
    const response = await apiClient.post('/v1/auth/reset-password', { token, password });
    return response.data;
  },

  // Change password (authenticated users)
  changePassword: async (currentPassword, newPassword) => {
    const response = await apiClient.put('/v1/auth/change-password', { 
      currentPassword, 
      newPassword 
    });
    return response.data;
  },

  // Verify email with token
  verifyEmail: async (token) => {
    const response = await apiClient.get(`/v1/auth/verify-email?token=${token}`);
    return response.data;
  },

  // Resend verification email
  resendVerification: async (email) => {
    const response = await apiClient.post('/v1/auth/resend-verification', { email });
    return response.data;
  },
};

// Named exports for convenience
export const { 
  register, 
  login, 
  googleLogin, 
  logout, 
  refreshToken, 
  forgotPassword, 
  resetPassword, 
  changePassword,
  verifyEmail,
  resendVerification,
} = authAPI;
