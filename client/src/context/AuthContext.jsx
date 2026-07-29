import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || '';

// Axios instance with auth token
export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vaidi_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('vaidi_token');
      localStorage.removeItem('vaidi_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('vaidi_user');
    const token = localStorage.getItem('vaidi_token');
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = async (phone, password) => {
    const res = await api.post('/api/auth/login', { phone, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('vaidi_token', token);
    localStorage.setItem('vaidi_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (name, phone, password, village) => {
    const res = await api.post('/api/auth/register', { name, phone, password, village });
    const { token, user: userData } = res.data;
    localStorage.setItem('vaidi_token', token);
    localStorage.setItem('vaidi_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('vaidi_token');
    localStorage.removeItem('vaidi_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
