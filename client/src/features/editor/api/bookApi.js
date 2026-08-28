import apiClient from '../../../lib/apiClient';

export const bookApi = {
  getBooks: async () => {
    const response = await apiClient.get('/books');
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
  }
};
