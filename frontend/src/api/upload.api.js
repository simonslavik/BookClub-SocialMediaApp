import apiClient from './axios';

/**
 * Upload a chat file
 * @param {File} file - The file to upload
 * @returns {Promise} - The upload response
 */
export const uploadChatFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/upload/chat-file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Delete a chat file
 * @param {string} fileId - The file ID to delete
 * @returns {Promise} - The delete response
 */
export const deleteChatFile = async (fileId) => {
  const response = await apiClient.delete(`/upload/chat-files/${fileId}`);
  return response.data;
};
