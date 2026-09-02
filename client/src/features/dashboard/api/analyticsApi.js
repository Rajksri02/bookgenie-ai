import apiClient from '../../../lib/apiClient';

export const analyticsApi = {
  getUsageStats: async () => {
    const response = await apiClient.get('/analytics/usage');
    return response.data;
  }
};
