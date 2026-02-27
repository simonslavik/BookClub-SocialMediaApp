import apiClient from './axios';

export const userAPI = {
  // Get user profile
  getProfile: async (userId) => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  // Update user profile
  updateProfile: async (userId, updates) => {
    const response = await apiClient.put(`/users/${userId}`, updates);
    return response.data;
  },

  // Upload profile image
  uploadProfileImage: async (formData) => {
    const response = await apiClient.post('/users/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Delete profile image
  deleteProfileImage: async () => {
    const response = await apiClient.delete('/users/profile-image');
    return response.data;
  },

  // Update user status
  updateStatus: async (status) => {
    const response = await apiClient.patch('/v1/profile/status', { status });
    return response.data;
  },

  // Get user's bookclubs
  getUserBookclubs: async (userId) => {
    const response = await apiClient.get(`/users/${userId}/bookclubs`);
    return response.data;
  },

  // Search users
  searchUsers: async (query) => {
    const response = await apiClient.get('/v1/users/search', {
      params: { q: query },
    });
    return response.data;
  },
};
