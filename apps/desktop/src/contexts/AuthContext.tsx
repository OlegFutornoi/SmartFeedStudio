import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { UserProfile } from '@smartfeed/shared';
import {
  loginUser,
  registerUser,
  getCurrentUser,
  refreshAuthSession,
  updateUserAvatar,
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  type LoginCredentials,
  type RegisterCredentials,
} from '@/lib/api';
import { setSentryUser } from '@/lib/sentry';
import { getLocalAvatar, saveLocalAvatar } from '@/services/localUserProfile';
import { mockDatabaseDriver } from '@/services/local-db/mock-driver';
import { emitDataSync } from '@/lib/syncEvents';

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
  updateAvatar: (avatarUrl: string | null) => Promise<void>;
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
        const parsed = JSON.parse(saved) as UserProfile;
        if (parsed?.id) {
          mockDatabaseDriver.switchUser(parsed.id);
        }
        return parsed;
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
    mockDatabaseDriver.switchUser(null);
    emitDataSync(['suppliers', 'feeds', 'products', 'quotas', 'all']);
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
      const localAvatar = await getLocalAvatar(profile.id);
      if (localAvatar === '') {
        profile.avatarUrl = null;
      } else if (localAvatar) {
        profile.avatarUrl = localAvatar;
      }
      mockDatabaseDriver.switchUser(profile.id);
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

  // Synchronize authenticated user identity with Sentry monitoring
  useEffect(() => {
    if (user) {
      setSentryUser({ id: user.id, email: user.email });
    } else {
      setSentryUser(null);
    }
  }, [user]);

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

      mockDatabaseDriver.switchUser(userProfile.id);
      emitDataSync(['suppliers', 'feeds', 'products', 'quotas', 'all']);

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

      mockDatabaseDriver.switchUser(userProfile.id);
      emitDataSync(['suppliers', 'feeds', 'products', 'quotas', 'all']);

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

      mockDatabaseDriver.switchUser(userProfile.id);
      emitDataSync(['suppliers', 'feeds', 'products', 'quotas', 'all']);

      setToken(accessToken);
      setUser(userProfile);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync local avatar for desktop user
  useEffect(() => {
    if (user?.id) {
      getLocalAvatar(user.id).then((localAvatar) => {
        if (localAvatar === '' && user.avatarUrl) {
          setUser((prev) => (prev ? { ...prev, avatarUrl: null } : null));
        } else if (localAvatar && user.avatarUrl !== localAvatar) {
          setUser((prev) => (prev ? { ...prev, avatarUrl: localAvatar } : null));
        }
      });
    }
  }, [user?.id, user?.avatarUrl]);

  const updateAvatar = useCallback(
    async (avatarUrl: string | null) => {
      if (!user) return;
      const normalized = avatarUrl && avatarUrl.trim() !== '' ? avatarUrl : null;
      await saveLocalAvatar(user.id, normalized);
      setUser((prev) => {
        if (!prev) return null;
        const updated = { ...prev, avatarUrl: normalized };
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
        return updated;
      });

      // Synchronize with backend API if authenticated
      try {
        await updateUserAvatar(normalized);
      } catch (err) {
        console.warn('[AuthContext] Backend avatar sync skipped:', err);
      }
    },
    [user],
  );

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
      updateAvatar,
    }),
    [user, token, isLoading, login, register, setAuthSession, logout, refreshProfile, updateAvatar],
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
