import apiClient from './axios';

export const bookclubAPI = {
  // Get all bookclubs for user
  getMyBookclubs: async () => {
    const response = await apiClient.get('/v1/bookclubs/my');
    return response.data;
  },

  // Get bookclub by ID
  getBookclub: async (bookclubId) => {
    const response = await apiClient.get(`/v1/bookclubs/${bookclubId}`);
    return response.data;
  },

  // Create new bookclub
  createBookclub: async (bookclubData) => {
    const response = await apiClient.post('/v1/bookclubs', bookclubData);
    return response.data;
  },

  // Update bookclub
  updateBookclub: async (bookclubId, updates) => {
    const response = await apiClient.put(`/v1/bookclubs/${bookclubId}`, updates);
    return response.data;
  },

  // Delete bookclub
  deleteBookclub: async (bookclubId) => {
    const response = await apiClient.delete(`/v1/bookclubs/${bookclubId}`);
    return response.data;
  },

  // Join bookclub via invite
  joinBookclub: async (inviteCode) => {
    const response = await apiClient.post(`/v1/bookclubs/join/${inviteCode}`);
    return response.data;
  },

  // Generate invite code
  generateInvite: async (bookclubId) => {
    const response = await apiClient.post(`/v1/bookclubs/${bookclubId}/invite`);
    return response.data;
  },

  // Get bookclub books
  getBookclubBooks: async (bookclubId) => {
    const response = await apiClient.get(`/bookclub/${bookclubId}/books`);
    return response.data;
  },

  // Add book to bookclub
  addBookToBookclub: async (bookclubId, bookData) => {
    const response = await apiClient.post(`/bookclub/${bookclubId}/books`, bookData);
    return response.data;
  },

  // Get book suggestions
  getBookSuggestions: async (bookclubId) => {
    const response = await apiClient.get(`/bookclub/${bookclubId}/suggestions`);
    return response.data;
  },

  // Add book suggestion
  addBookSuggestion: async (bookclubId, suggestionData) => {
    const response = await apiClient.post(`/bookclub/${bookclubId}/suggestions`, suggestionData);
    return response.data;
  },

  // Vote on suggestion
  voteOnSuggestion: async (bookclubId, suggestionId, vote) => {
    const response = await apiClient.post(`/bookclub/${bookclubId}/suggestions/${suggestionId}/vote`, { vote });
    return response.data;
  },

  // Get reading progress
  getReadingProgress: async (bookclubId, bookId) => {
    const response = await apiClient.get(`/bookclub-books/${bookclubId}/books/${bookId}/progress`);
    return response.data;
  },

  // Update reading progress
  updateReadingProgress: async (bookclubId, bookId, progressData) => {
    const response = await apiClient.put(`/bookclub-books/${bookclubId}/books/${bookId}/progress`, progressData);
    return response.data;
  },

  // Upload bookclub image
  uploadImage: async (bookclubId, formData) => {
    const response = await apiClient.post(`/v1/bookclubs/${bookclubId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // ===== NEW ACCESS CONTROL APIs =====
  
  // Discover bookclubs (public endpoint with optional auth)
  discoverBookclubs: async (category) => {
    const url = category ? `/v1/bookclubs/discover?category=${encodeURIComponent(category)}` : '/v1/bookclubs/discover';
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get club preview (limited info for non-members)
  getBookclubPreview: async (bookclubId) => {
    const response = await apiClient.get(`/v1/bookclubs/${bookclubId}/preview`);
    return response.data;
  },

  // Get full club details (members only)
  getBookclubFull: async (bookclubId) => {
    const response = await apiClient.get(`/v1/bookclubs/${bookclubId}`);
    return response.data;
  },

  // Join PUBLIC club instantly
  joinBookclubInstant: async (bookclubId) => {
    const response = await apiClient.post(`/v1/bookclubs/${bookclubId}/join`);
    return response.data;
  },

  // Request to join PRIVATE club
  requestToJoinBookclub: async (bookclubId, message) => {
    const response = await apiClient.post(`/v1/bookclubs/${bookclubId}/request`, { message });
    return response.data;
  },

  // Leave club
  leaveBookclub: async (bookclubId) => {
    const response = await apiClient.post(`/v1/bookclubs/${bookclubId}/leave`);
    return response.data;
  },

  // Get pending join requests (Admin/Owner only)
  getPendingRequests: async (bookclubId) => {
    const response = await apiClient.get(`/v1/bookclubs/${bookclubId}/requests`);
    return response.data;
  },

  // Approve join request (Admin/Owner only)
  approveJoinRequest: async (bookclubId, requestId) => {
    const response = await apiClient.post(`/v1/bookclubs/${bookclubId}/requests/${requestId}/approve`);
    return response.data;
  },

  // Reject join request (Admin/Owner only)
  rejectJoinRequest: async (bookclubId, requestId) => {
    const response = await apiClient.post(`/v1/bookclubs/${bookclubId}/requests/${requestId}/reject`);
    return response.data;
  },

  // Get shareable invite (Any member)
  getShareableInvite: async (bookclubId) => {
    const response = await apiClient.get(`/v1/bookclubs/${bookclubId}/invite`);
    return response.data;
  },

  // Get all invites (Admin/Owner only)
  getInvites: async (bookclubId) => {
    const response = await apiClient.get(`/v1/bookclubs/${bookclubId}/invites`);
    return response.data;
  },

  // Create invite link (Admin/Owner only)
  createInvite: async (bookclubId, { maxUses, expiresInDays }) => {
    const response = await apiClient.post(`/v1/bookclubs/${bookclubId}/invites`, { maxUses, expiresInDays });
    return response.data;
  },

  // Delete invite (Admin/Owner only)
  deleteInvite: async (bookclubId, inviteId) => {
    const response = await apiClient.delete(`/v1/bookclubs/${bookclubId}/invites/${inviteId}`);
    return response.data;
  },

  // Join via invite code
  joinByInviteCode: async (code) => {
    const response = await apiClient.post(`/v1/bookclubs/join-by-invite/${code}`);
    return response.data;
  },

  // Remove member (Admin/Owner only)
  removeMember: async (bookclubId, userId) => {
    const response = await apiClient.delete(`/v1/bookclubs/${bookclubId}/members/${userId}`);
    return response.data;
  },

  // Update member role (Owner only)
  updateMemberRole: async (bookclubId, userId, role) => {
    const response = await apiClient.put(`/v1/bookclubs/${bookclubId}/members/${userId}/role`, { role });
    return response.data;
  },

  // Update club settings (Admin/Owner only)
  updateBookclubSettings: async (bookclubId, settings) => {
    const response = await apiClient.put(`/v1/bookclubs/${bookclubId}`, settings);
    return response.data;
  },
};
