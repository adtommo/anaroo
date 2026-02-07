import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface User {
  _id?: string;
  nickname: string;
  createdAt: Date;
  xp?: number;
  level?: number;
  avatarId?: string;
  theme?: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (nickname: string) => Promise<void>;
  register: (nickname: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
      }
    }
    setLoading(false);
  }, []);

  const login = async (nickname: string) => {
    const result = await apiService.login(nickname);
    setUser(result.user);
    localStorage.setItem('user', JSON.stringify(result.user));
  };

  const register = async (nickname: string) => {
    const result = await apiService.register(nickname);
    setUser(result.user);
    localStorage.setItem('user', JSON.stringify(result.user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    apiService.clearToken();
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}