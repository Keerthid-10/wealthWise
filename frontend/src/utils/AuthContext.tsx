import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: any) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(!!sessionStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    console.log('[AuthContext] State changed - isAuthenticated:', isAuthenticated, 'user:', user);
  }, [isAuthenticated, user]);

  const fetchUserProfile = async () => {
    try {
      console.log('[AuthContext] Fetching user profile...');
      const response = await authAPI.getProfile();
      console.log('[AuthContext] Profile response:', response.data);

      // Backend returns { success: true, user: {...} }
      if (response.data.success && response.data.user) {
        console.log('[AuthContext] Setting user and isAuthenticated to true');
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        console.error('[AuthContext] Invalid profile response from server');
        logout();
      }
      setIsLoading(false);
    } catch (error: any) {
      console.error('[AuthContext] Failed to fetch profile:', error);
      // If token is invalid or expired, clear everything and logout
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('[AuthContext] Invalid or expired token - logging out');
      }
      logout();
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Login attempt...');
      const response = await authAPI.login({ email, password });
      console.log('[AuthContext] Login response:', response.data);

      // Backend returns { success: true, user: {...}, token: "..." }
      if (response.data.success && response.data.token && response.data.user) {
        const { token: newToken, user: userData } = response.data;

        console.log('[AuthContext] Login successful, setting auth state');
        sessionStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true);
        console.log('[AuthContext] isAuthenticated set to true');
      } else {
        throw new Error('Invalid login response from server');
      }
    } catch (error: any) {
      console.error('[AuthContext] Login error:', error);
      throw new Error(error.response?.data?.errors?.[0] || 'Login failed');
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await authAPI.register(userData);

      // Backend returns { success: true, user: {...}, token: "..." }
      if (response.data.success && response.data.token && response.data.user) {
        const { token: newToken, user: newUser } = response.data;

        sessionStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
        setIsAuthenticated(true);
      } else {
        throw new Error('Invalid registration response from server');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0] || 'Registration failed');
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = async (userData: any) => {
    try {
      const response = await authAPI.updateProfile(userData);

      // Backend returns { success: true, user: {...} }
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
      } else {
        throw new Error('Invalid update response from server');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.errors?.[0] || 'Update failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
