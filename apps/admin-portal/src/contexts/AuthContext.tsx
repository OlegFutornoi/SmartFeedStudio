'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, LoginDto, ChangePasswordDto } from '@smartfeed/shared';
import { api } from '@/lib/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (dto: LoginDto) => Promise<void>;
  logout: () => void;
  changePassword: (dto: ChangePasswordDto) => Promise<void>;
  updateAvatar: (avatarUrl: string | null) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isFetchingRef = useRef(false);

  const fetchCurrentUser = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const storedToken = localStorage.getItem('smartfeed_admin_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      setToken(storedToken);
      const profile = await api.getMe();
      if (profile.role !== 'ADMIN' && profile.role !== 'SUPER_ADMIN') {
        localStorage.removeItem('smartfeed_admin_token');
        api.setToken(null);
        setUser(null);
        setToken(null);
        return;
      }
      setUser(profile);
    } catch (e) {
      console.warn('[AuthContext:fetchCurrentUser] Failed to fetch profile, clearing session:', e);
      localStorage.removeItem('smartfeed_admin_token');
      setUser(null);
      setToken(null);
    } finally {
      isFetchingRef.current = false;
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
      if (res.user.role !== 'ADMIN' && res.user.role !== 'SUPER_ADMIN') {
        localStorage.removeItem('smartfeed_admin_token');
        api.setToken(null);
        setUser(null);
        setToken(null);
        throw new Error('access_denied_admin_only');
      }
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

  const updateAvatar = async (avatarUrl: string | null) => {
    setError(null);
    const updated = await api.updateAvatar(avatarUrl);
    setUser(updated);
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
        updateAvatar,
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
