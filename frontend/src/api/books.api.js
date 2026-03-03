import apiClient from './axios';

export const booksAPI = {
  // Search books
  searchBooks: async (query, limit = 20) => {
    const response = await apiClient.get('/books/search', {
      params: { q: query, limit },
    });
    return response.data;
  },

  // Get book details
  getBookDetails: async (googleBooksId) => {
    const response = await apiClient.get(`/books/google/${googleBooksId}`);
    return response.data;
  },

  // Add book to user's library
  addToLibrary: async (bookData) => {
    const response = await apiClient.post('/user-books', bookData);
    return response.data;
  },

  // Get user's books
  getUserBooks: async (userId) => {
    const response = await apiClient.get(`/user-books/${userId}`);
    return response.data;
  },

  // Update reading progress
  updateProgress: async (bookId, progressData) => {
    const response = await apiClient.put(`/user-books/${bookId}/progress`, progressData);
    return response.data;
  },

  // Remove book from library
  removeFromLibrary: async (bookId) => {
    const response = await apiClient.delete(`/user-books/${bookId}`);
    return response.data;
  },
};
