import apiClient from '../../../lib/apiClient';

export const aiApi = {
  generateOutline: async (params) => {
    return apiClient.post('/ai/outline', params);
  },
  
  regenerateChapter: async (params) => {
    return apiClient.post('/ai/outline/regenerate-chapter', params);
  }
};
