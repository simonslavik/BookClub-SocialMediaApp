import apiClient from './axios';
import { cachedFetch, invalidateCache, invalidateCachePattern } from '@utils/apiCache';

export const bookclubAPI = {
  // Get all bookclubs for user (cached 2 min)
  getMyBookclubs: async () => {
    return cachedFetch('bookclubs:my', async () => {
      const response = await apiClient.get('/v1/bookclubs/my');
      return response.data;
    });
  },

  // Get bookclub by ID (cached 2 min)
  getBookclub: async (bookclubId) => {
    return cachedFetch(`bookclub:${bookclubId}`, async () => {
      const response = await apiClient.get(`/v1/bookclubs/${bookclubId}`);
      return response.data;
    });
  },

  // Create new bookclub
  createBookclub: async (bookclubData) => {
    const response = await apiClient.post('/v1/bookclubs', bookclubData);
    invalidateCache('bookclubs:my');
    invalidateCachePattern('discover');
    return response.data;
  },

  // Update bookclub
  updateBookclub: async (bookclubId, updates) => {
    const response = await apiClient.put(`/v1/bookclubs/${bookclubId}`, updates);
    invalidateCache(`bookclub:${bookclubId}`, `bookclub:preview:${bookclubId}`, 'bookclubs:my');
    invalidateCachePattern('discover');
    return response.data;
  },

  // Delete bookclub
  deleteBookclub: async (bookclubId) => {
    const response = await apiClient.delete(`/v1/bookclubs/${bookclubId}`);
    invalidateCachePattern(bookclubId);
    invalidateCache('bookclubs:my');
    invalidateCachePattern('discover');
    return response.data;
  },

  // Join bookclub via invite
  joinBookclub: async (inviteCode) => {
    const response = await apiClient.post(`/v1/bookclubs/join/${inviteCode}`);
    invalidateCache('bookclubs:my');
    return response.data;
  },

  // Generate invite code
  generateInvite: async (bookclubId) => {
    const response = await apiClient.post(`/v1/bookclubs/${bookclubId}/invite`);
    return response.data;
  },

  // Get bookclub books (cached 2 min)
  getBookclubBooks: async (bookclubId) => {
    return cachedFetch(`bookclub:books:${bookclubId}`, async () => {
      const response = await apiClient.get(`/bookclub/${bookclubId}/books`);
      return response.data;
    });
  },

  // Add book to bookclub
  addBookToBookclub: async (bookclubId, bookData) => {
    const response = await apiClient.post(`/bookclub/${bookclubId}/books`, bookData);
    invalidateCache(`bookclub:books:${bookclubId}`);
    return response.data;
  },

  // Get book suggestions (cached 1 min)
  getBookSuggestions: async (bookclubId) => {
    return cachedFetch(`bookclub:suggestions:${bookclubId}`, async () => {
      const response = await apiClient.get(`/bookclub/${bookclubId}/suggestions`);
      return response.data;
    }, 60_000);
  },

  // Add book suggestion
  addBookSuggestion: async (bookclubId, suggestionData) => {
    const response = await apiClient.post(`/bookclub/${bookclubId}/suggestions`, suggestionData);
    invalidateCache(`bookclub:suggestions:${bookclubId}`);
    return response.data;
  },

  // Vote on suggestion
  voteOnSuggestion: async (bookclubId, suggestionId, vote) => {
    const response = await apiClient.post(`/bookclub/${bookclubId}/suggestions/${suggestionId}/vote`, { vote });
    invalidateCache(`bookclub:suggestions:${bookclubId}`);
    return response.data;
  },

  // Get reading progress (cached 1 min)
  getReadingProgress: async (bookclubId, bookId) => {
    return cachedFetch(`bookclub:progress:${bookclubId}:${bookId}`, async () => {
      const response = await apiClient.get(`/bookclub-books/${bookclubId}/books/${bookId}/progress`);
      return response.data;
    }, 60_000);
  },

  // Update reading progress
  updateReadingProgress: async (bookclubId, bookId, progressData) => {
    const response = await apiClient.put(`/bookclub-books/${bookclubId}/books/${bookId}/progress`, progressData);
    invalidateCache(`bookclub:progress:${bookclubId}:${bookId}`);
    return response.data;
  },

  // Upload bookclub image
  uploadImage: async (bookclubId, formData) => {
    const response = await apiClient.post(`/v1/bookclubs/${bookclubId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    invalidateCache(`bookclub:${bookclubId}`, `bookclub:preview:${bookclubId}`);
    invalidateCachePattern('discover');
    return response.data;
  },

  // ===== NEW ACCESS CONTROL APIs =====
  
  // Discover bookclubs (public endpoint with optional auth, cached 1 min)
  discoverBookclubs: async (category) => {
    const cacheKey = category ? `discover:${category}` : 'discover:all';
    return cachedFetch(cacheKey, async () => {
      const url = category ? `/v1/bookclubs/discover?category=${encodeURIComponent(category)}` : '/v1/bookclubs/discover';
      const response = await apiClient.get(url);
      return response.data;
    }, 60_000);
  },

  // Get club preview (cached 2 min)
  getBookclubPreview: async (bookclubId) => {
    return cachedFetch(`bookclub:preview:${bookclubId}`, async () => {
      const response = await apiClient.get(`/v1/bookclubs/${bookclubId}/preview`);
      return response.data;
    });
  },

  // Get full club details (cached 2 min)
  getBookclubFull: async (bookclubId) => {
    return cachedFetch(`bookclub:full:${bookclubId}`, async () => {
      const response = await apiClient.get(`/v1/bookclubs/${bookclubId}`);
      return response.data;
    });
  },

  // Join PUBLIC club instantly
  joinBookclubInstant: async (bookclubId) => {
    const response = await apiClient.post(`/v1/bookclubs/${bookclubId}/join`);
    invalidateCache(`bookclub:${bookclubId}`, `bookclub:preview:${bookclubId}`, 'bookclubs:my');
    invalidateCachePattern('discover');
    return response.data;
  },

  // Request to join PRIVATE club
  requestToJoinBookclub: async (bookclubId, message) => {
    const response = await apiClient.post(`/v1/bookclubs/${bookclubId}/request`, { message });
    invalidateCache(`bookclub:preview:${bookclubId}`);
    return response.data;
  },

  // Leave club
  leaveBookclub: async (bookclubId) => {
    const response = await apiClient.post(`/v1/bookclubs/${bookclubId}/leave`);
    invalidateCachePattern(bookclubId);
    invalidateCache('bookclubs:my');
    invalidateCachePattern('discover');
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
    invalidateCache(`bookclub:${bookclubId}`, `bookclub:preview:${bookclubId}`);
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

  // Join via invite code
  joinByInviteCode: async (code) => {
    const response = await apiClient.post(`/v1/bookclubs/join-by-invite/${code}`);
    invalidateCache('bookclubs:my');
    return response.data;
  },

  // Remove member (Admin/Owner only)
  removeMember: async (bookclubId, userId) => {
    const response = await apiClient.delete(`/v1/bookclubs/${bookclubId}/members/${userId}`);
    invalidateCache(`bookclub:${bookclubId}`, `bookclub:preview:${bookclubId}`);
    return response.data;
  },

  // Update member role (Owner only)
  updateMemberRole: async (bookclubId, userId, role) => {
    const response = await apiClient.put(`/v1/bookclubs/${bookclubId}/members/${userId}/role`, { role });
    invalidateCache(`bookclub:${bookclubId}`);
    return response.data;
  },

  // Update club settings (Admin/Owner only)
  updateBookclubSettings: async (bookclubId, settings) => {
    const response = await apiClient.put(`/v1/bookclubs/${bookclubId}`, settings);
    invalidateCache(`bookclub:${bookclubId}`, `bookclub:preview:${bookclubId}`, `bookclub:full:${bookclubId}`, 'bookclubs:my');
    invalidateCachePattern('discover');
    return response.data;
  },

  // ===== ROOM MANAGEMENT APIs =====

  // Create room
  createRoom: async (bookclubId, roomData) => {
    const response = await apiClient.post(`/v1/bookclubs/${bookclubId}/rooms`, roomData);
    invalidateCache(`bookclub:${bookclubId}`);
    return response.data;
  },

  // Update room
  updateRoom: async (bookclubId, roomId, updates) => {
    const response = await apiClient.patch(`/v1/bookclubs/${bookclubId}/rooms/${roomId}`, updates);
    invalidateCache(`bookclub:${bookclubId}`);
    return response.data;
  },

  // Delete room
  deleteRoom: async (bookclubId, roomId) => {
    const response = await apiClient.delete(`/v1/bookclubs/${bookclubId}/rooms/${roomId}`);
    invalidateCache(`bookclub:${bookclubId}`);
    return response.data;
  },

  // Get room members
  getRoomMembers: async (bookclubId, roomId) => {
    const response = await apiClient.get(`/v1/bookclubs/${bookclubId}/rooms/${roomId}/members`);
    return response.data;
  },

  // Add members to room
  addRoomMembers: async (bookclubId, roomId, memberIds) => {
    const response = await apiClient.post(`/v1/bookclubs/${bookclubId}/rooms/${roomId}/members`, { memberIds });
    return response.data;
  },

  // Remove member from room
  removeRoomMember: async (bookclubId, roomId, userId) => {
    const response = await apiClient.delete(`/v1/bookclubs/${bookclubId}/rooms/${roomId}/members/${userId}`);
    return response.data;
  },

  // ===== MEETING APIs =====

  // Get meetings for a bookclub (cached 1 min)
  getMeetings: async (bookclubId, includePast = false) => {
    const cacheKey = `bookclub:meetings:${bookclubId}:${includePast}`;
    return cachedFetch(cacheKey, async () => {
      const response = await apiClient.get(`/v1/bookclubs/${bookclubId}/meetings${includePast ? '?includePast=true' : ''}`);
      return response.data;
    }, 60_000);
  },

  // Create a meeting
  createMeeting: async (bookclubId, meetingData) => {
    const response = await apiClient.post(`/v1/bookclubs/${bookclubId}/meetings`, meetingData);
    invalidateCachePattern(`bookclub:meetings:${bookclubId}`);
    return response.data;
  },

  // Update a meeting
  updateMeeting: async (bookclubId, meetingId, updates) => {
    const response = await apiClient.patch(`/v1/bookclubs/${bookclubId}/meetings/${meetingId}`, updates);
    invalidateCachePattern(`bookclub:meetings:${bookclubId}`);
    return response.data;
  },

  // Delete a meeting
  deleteMeeting: async (bookclubId, meetingId) => {
    const response = await apiClient.delete(`/v1/bookclubs/${bookclubId}/meetings/${meetingId}`);
    invalidateCachePattern(`bookclub:meetings:${bookclubId}`);
    return response.data;
  },

  // RSVP to a meeting
  rsvpMeeting: async (bookclubId, meetingId, status) => {
    const response = await apiClient.post(`/v1/bookclubs/${bookclubId}/meetings/${meetingId}/rsvp`, { status });
    invalidateCachePattern(`bookclub:meetings:${bookclubId}`);
    return response.data;
  },

  // Cancel RSVP
  cancelRsvp: async (bookclubId, meetingId) => {
    const response = await apiClient.delete(`/v1/bookclubs/${bookclubId}/meetings/${meetingId}/rsvp`);
    invalidateCachePattern(`bookclub:meetings:${bookclubId}`);
    return response.data;
  },
};
