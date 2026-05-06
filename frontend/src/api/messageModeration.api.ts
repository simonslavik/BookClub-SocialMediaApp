import apiClient from './axios';

export const messageModerationAPI = {
  // Delete message (MODERATOR+ or own message)
  deleteMessage: async (messageId) => {
    const response = await apiClient.delete(`/moderation/messages/${messageId}`);
    return response.data;
  },

  // Pin message (MODERATOR+)
  pinMessage: async (messageId) => {
    const response = await apiClient.post(`/moderation/messages/${messageId}/pin`);
    return response.data;
  },

  // Unpin message (MODERATOR+)
  unpinMessage: async (messageId) => {
    const response = await apiClient.delete(`/moderation/messages/${messageId}/pin`);
    return response.data;
  },

  // Get pinned messages for a room
  getPinnedMessages: async (roomId) => {
    const response = await apiClient.get(`/moderation/rooms/${roomId}/pinned-messages`);
    return response.data;
  },

  // Edit message (own messages only)
  editMessage: async (messageId, content) => {
    const response = await apiClient.put(`/moderation/messages/${messageId}`, { content });
    return response.data;
  },
};
