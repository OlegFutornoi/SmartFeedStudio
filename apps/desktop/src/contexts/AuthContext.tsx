import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { UserProfile } from '@smartfeed/shared';
import {
  loginUser,
  registerUser,
  getCurrentUser,
  type LoginCredentials,
  type RegisterCredentials,
} from '@/lib/api';

const TOKEN_KEY = 'smartfeed_access_token';
const USER_KEY = 'smartfeed_user_profile';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  setAuthSession: (authResponse: { tokens: { accessToken: string }; user: UserProfile }) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as UserProfile;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return !!localStorage.getItem(TOKEN_KEY);
  });

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const activeToken = localStorage.getItem(TOKEN_KEY);
    if (!activeToken) {
      setIsLoading(false);
      return;
    }

    try {
      const profile = await getCurrentUser(activeToken);
      setUser(profile);
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const activeToken = localStorage.getItem(TOKEN_KEY);
    if (activeToken) {
      refreshProfile();
    } else {
      setIsLoading(false);
    }
  }, [refreshProfile]);

  const setAuthSession = useCallback(
    (authResponse: { tokens: { accessToken: string }; user: UserProfile }) => {
      const accessToken = authResponse.tokens.accessToken;
      const userProfile = authResponse.user;

      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(userProfile));

      setToken(accessToken);
      setUser(userProfile);
    },
    [],
  );

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const authResponse = await loginUser(credentials);
      const accessToken = authResponse.tokens.accessToken;
      const userProfile = authResponse.user;

      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(userProfile));

      setToken(accessToken);
      setUser(userProfile);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    try {
      const authResponse = await registerUser(credentials);
      const accessToken = authResponse.tokens.accessToken;
      const userProfile = authResponse.user;

      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(userProfile));

      setToken(accessToken);
      setUser(userProfile);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      isLoading,
      login,
      register,
      setAuthSession,
      logout,
      refreshProfile,
    }),
    [user, token, isLoading, login, register, setAuthSession, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
