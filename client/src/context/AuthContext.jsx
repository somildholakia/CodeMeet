import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [socketToken, setSocketToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setSocketToken(data.socketToken || null);
    } catch {
      setUser(null);
      setSocketToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const applySession = (data) => {
    setUser(data.user);
    setSocketToken(data.socketToken || null);
    return data.user;
  };

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    return applySession(data);
  };

  const loginWithGoogle = async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    return applySession(data);
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      setSocketToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, socketToken, isLoading, login, loginWithGoogle, register, logout, setUser, restoreSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
