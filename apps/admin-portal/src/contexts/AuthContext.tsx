'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, LoginDto, ChangePasswordDto } from '@smartfeed/shared';
import { api } from '../lib/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (dto: LoginDto) => Promise<void>;
  logout: () => void;
  changePassword: (dto: ChangePasswordDto) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchCurrentUser = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('smartfeed_admin_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      setToken(storedToken);
      const profile = await api.getMe();
      setUser(profile);
    } catch {
      localStorage.removeItem('smartfeed_admin_token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (dto: LoginDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.login(dto);
      setUser(res.user);
      setToken(res.tokens.accessToken);
      router.push('/');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Не вдалося увійти. Перевірте email та пароль.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  const changePassword = async (dto: ChangePasswordDto) => {
    setError(null);
    await api.changePassword(dto);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        login,
        logout,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
