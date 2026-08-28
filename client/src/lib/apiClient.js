import axios from 'axios';

// In-memory token storage (more secure than localStorage)
let memoryToken = null;

export const setMemoryToken = (token) => {
  memoryToken = token;
};

export const getMemoryToken = () => {
  return memoryToken;
};

// Create a centralized axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5050/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial for sending/receiving httpOnly cookies (like refreshToken)
});

// Request Interceptor: Attach the JWT token to every request if it exists
apiClient.interceptors.request.use(
  (config) => {
    const token = getMemoryToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Prevent infinite loops if the refresh token itself fails
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handle global errors and silent refresh
apiClient.interceptors.response.use(
  (response) => {
    return response.data; // Simplify response payload
  },
  async (error) => {
    const originalRequest = error.config;

    const isAuthRoute = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register');

    // If 401 Unauthorized, we haven't already tried to refresh, and it's not a login/register request
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        // If already refreshing, queue this request until refresh is done
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call the refresh endpoint (this will automatically send the httpOnly cookie)
        // We use a separate axios instance to avoid interceptor loops
        const refreshResponse = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`, 
          {}, 
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.accessToken;
        
        // Save new token in memory
        setMemoryToken(newAccessToken);
        
        // Update header of original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        processQueue(null, newAccessToken);
        
        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed (e.g., token expired or invalid). Clear state and redirect via event.
        setMemoryToken(null);
        window.dispatchEvent(new Event('auth:unauthorized'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error.response?.data || error);
  }
);

export default apiClient;
