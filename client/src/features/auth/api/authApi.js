import apiClient from '../../../lib/apiClient';

export const authApi = {
  login: async (credentials) => {
    return apiClient.post('/auth/login', credentials);
  },
  
  register: async (userData) => {
    return apiClient.post('/auth/register', userData);
  },
  
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response;
  },
  
  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response;
  },

  resetPassword: async (token, password) => {
    const response = await apiClient.put(`/auth/reset-password/${token}`, { password });
    return response;
  },
  
  getMe: async () => {
    return apiClient.get('/auth/me');
  }
};
