// hooks/useAuth.js
import { useState, useEffect } from 'react';
import { permissionsService } from '../services/permissionsService';
import { rbacApi } from '../services/rbacApi';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token) {
      setIsAuthenticated(true);
      setUser(userData ? JSON.parse(userData) : null);
    }
    setLoading(false);
  };

  const login = (token, userData) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    permissionsService.clearPermissions();
    rbacApi.clearCache();
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    permissionsService.clearPermissions();
    rbacApi.clearCache();
    setIsAuthenticated(false);
    setUser(null);
  };

  return {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    checkAuth,
  };
};
