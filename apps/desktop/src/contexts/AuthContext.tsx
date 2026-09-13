import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { UserProfile } from '@smartfeed/shared';
import {
  loginUser,
  registerUser,
  getCurrentUser,
  refreshAuthSession,
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  type LoginCredentials,
  type RegisterCredentials,
} from '@/lib/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  setAuthSession: (authResponse: {
    tokens: { accessToken: string; refreshToken?: string };
    user: UserProfile;
  }) => void;
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
      } catch (e) {
        console.warn('[AuthContext] Failed to parse saved user profile:', e);
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
    localStorage.removeItem(REFRESH_TOKEN_KEY);
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
      // In case token was silently refreshed during getCurrentUser
      const currentStoredToken = localStorage.getItem(TOKEN_KEY);
      if (currentStoredToken && currentStoredToken !== activeToken) {
        setToken(currentStoredToken);
      }
    } catch (e) {
      console.warn('[AuthContext:refreshProfile] Failed to refresh user profile:', e);
      // Only logout if even refresh failed
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        logout();
      }
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

  // Proactive background silent refresh every 10 minutes to keep session active indefinitely
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(
      async () => {
        const refreshedToken = await refreshAuthSession();
        if (refreshedToken) {
          setToken(refreshedToken);
        }
      },
      10 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [token]);

  const setAuthSession = useCallback(
    (authResponse: {
      tokens: { accessToken: string; refreshToken?: string };
      user: UserProfile;
    }) => {
      const accessToken = authResponse.tokens.accessToken;
      const userProfile = authResponse.user;

      localStorage.setItem(TOKEN_KEY, accessToken);
      if (authResponse.tokens.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, authResponse.tokens.refreshToken);
      }
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
      if (authResponse.tokens.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, authResponse.tokens.refreshToken);
      }
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
      if (authResponse.tokens.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, authResponse.tokens.refreshToken);
      }
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
