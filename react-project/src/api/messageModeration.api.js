import apiClient from './axios';

export const messageModerationAPI = {
  // Delete message (MODERATOR+ or own message)
  deleteMessage: async (messageId) => {
    const response = await apiClient.delete(`/v1/moderation/messages/${messageId}`);
    return response.data;
  },

  // Pin message (MODERATOR+)
  pinMessage: async (messageId) => {
    const response = await apiClient.post(`/v1/moderation/messages/${messageId}/pin`);
    return response.data;
  },

  // Unpin message (MODERATOR+)
  unpinMessage: async (messageId) => {
    const response = await apiClient.delete(`/v1/moderation/messages/${messageId}/pin`);
    return response.data;
  },

  // Get pinned messages for a room
  getPinnedMessages: async (roomId) => {
    const response = await apiClient.get(`/v1/moderation/rooms/${roomId}/pinned-messages`);
    return response.data;
  },
};
