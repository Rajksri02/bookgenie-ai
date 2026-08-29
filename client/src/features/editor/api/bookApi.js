import apiClient from '../../../lib/apiClient';

export const bookApi = {
  getBooks: async () => {
    const response = await apiClient.get('/books');
    return response;
  },

  createBook: async (metadata, chapters) => {
    const response = await apiClient.post('/books', { metadata, chapters });
    return response;
  },

  updateBook: async (bookId, metadata, chapters) => {
    const response = await apiClient.put(`/books/${bookId}`, { metadata, chapters });
    return response;
  },

  /**
   * Autosave a chapter's content
   * @param {string} chapterId 
   * @param {string} content 
   */
  autosaveChapter: async (chapterId, content) => {
    const response = await apiClient.post(`/books/chapters/${chapterId}/autosave`, { content });
    return response.data;
  },

  /**
   * Reorder chapters
   * @param {string} bookId 
   * @param {string[]} chapterIds 
   */
  reorderChapters: async (bookId, chapterIds) => {
    const response = await apiClient.put(`/books/${bookId}/chapters/reorder`, { chapterIds });
    return response;
  },

  uploadCoverImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiClient.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  generateCoverImage: async (metadata) => {
    // metadata: { title, genre, tone }
    const response = await apiClient.post('/images/generate', metadata);
    return response;
  }
};
