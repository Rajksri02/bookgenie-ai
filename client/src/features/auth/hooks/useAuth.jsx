import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';
import axios from 'axios';
import apiClient, { setMemoryToken } from '../../../lib/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Attempt a silent refresh via httpOnly cookie right on mount
        const refreshResponse = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`, 
          {}, 
          { withCredentials: true }
        );
        
        const newAccessToken = refreshResponse.data.accessToken;
        setMemoryToken(newAccessToken);
        
        // If successful, fetch user data
        const userRes = await authApi.getMe();
        setUser(userRes.data);
      } catch (error) {
        // Normal if there's no valid session/cookie yet
        setUser(null);
        setMemoryToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for unauthorized events dispatched by apiClient
    const handleUnauthorized = () => {
      setUser(null);
      setMemoryToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    setMemoryToken(res.accessToken);
    setUser(res.data);
    return res;
  }, []);

  const register = useCallback(async (userData) => {
    const res = await authApi.register(userData);
    setMemoryToken(res.accessToken);
    setUser(res.data);
    return res;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setMemoryToken(null);
      setUser(null);
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
