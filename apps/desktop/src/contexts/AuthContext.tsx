import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { UserProfile } from '@smartfeed/shared';
import {
  loginUser,
  registerUser,
  getCurrentUser,
  refreshAuthSession,
  updateUserAvatar,
  type LoginCredentials,
  type RegisterCredentials,
} from '@/lib/api';
import { setSentryUser } from '@/lib/sentry';
import { getLocalAvatar, saveLocalAvatar } from '@/services/localUserProfile';
import { authSessionStorage } from '@/services/authSessionStorage';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isSuspended: boolean;
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
  const [token, setToken] = useState<string | null>(() => authSessionStorage.getInitialToken());
  const [user, setUser] = useState<UserProfile | null>(() => authSessionStorage.getInitialUser());
  const [isSuspended, setIsSuspended] = useState<boolean>(() =>
    authSessionStorage.getInitialSuspended(),
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => !!authSessionStorage.getInitialToken());

  // Listen to global user-suspended events dispatched by API client on 403 Forbidden
  useEffect(() => {
    const handleSuspended = () => {
      setIsSuspended(true);
      setUser((prev) => (prev ? { ...prev, isActive: false } : prev));
    };
    window.addEventListener('smartfeed:user-suspended', handleSuspended);
    return () => window.removeEventListener('smartfeed:user-suspended', handleSuspended);
  }, []);

  const logout = useCallback(() => {
    authSessionStorage.clearSession();
    setToken(null);
    setUser(null);
    setIsSuspended(false);
  }, []);

  const setAuthSession = useCallback(
    (authResponse: {
      tokens: { accessToken: string; refreshToken?: string };
      user: UserProfile;
    }) => {
      const accessToken = authResponse.tokens.accessToken;
      const userProfile = authResponse.user;

      authSessionStorage.saveSession(authResponse.tokens, userProfile);
      setToken(accessToken);
      setUser(userProfile);
      setIsSuspended(userProfile.isActive === false);
    },
    [],
  );

  const refreshProfile = useCallback(async () => {
    const activeToken = authSessionStorage.getInitialToken();
    if (!activeToken) {
      setIsLoading(false);
      return;
    }

    try {
      const profile = await getCurrentUser(activeToken);
      setIsSuspended(profile.isActive === false);

      const localAvatar = await getLocalAvatar(profile.id);
      if (localAvatar === '') {
        profile.avatarUrl = null;
      } else if (localAvatar) {
        profile.avatarUrl = localAvatar;
      }

      setUser(profile);
      authSessionStorage.saveUser(profile);

      const currentStoredToken = authSessionStorage.getInitialToken();
      if (currentStoredToken && currentStoredToken !== activeToken) {
        setToken(currentStoredToken);
      }
    } catch (e: unknown) {
      console.warn('[AuthContext:refreshProfile] Failed to refresh user profile:', e);
      const err = e as { statusCode?: number; data?: { code?: string } };
      if (err?.statusCode === 403 || err?.data?.code === 'USER_SUSPENDED') {
        setIsSuspended(true);
        setUser((prev) => (prev ? { ...prev, isActive: false } : prev));
        return;
      }
      if (!authSessionStorage.getRefreshToken()) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const activeToken = authSessionStorage.getInitialToken();
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

  // Proactive background silent refresh every 10 minutes to keep session active
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

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setIsLoading(true);
      try {
        const authResponse = await loginUser(credentials);
        setAuthSession(authResponse);
      } finally {
        setIsLoading(false);
      }
    },
    [setAuthSession],
  );

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      setIsLoading(true);
      try {
        const authResponse = await registerUser(credentials);
        setAuthSession(authResponse);
      } finally {
        setIsLoading(false);
      }
    },
    [setAuthSession],
  );

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
        authSessionStorage.saveUser(updated);
        return updated;
      });

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
      isSuspended: isSuspended || user?.isActive === false,
      isLoading,
      login,
      register,
      setAuthSession,
      logout,
      refreshProfile,
      updateAvatar,
    }),
    [
      user,
      token,
      isSuspended,
      isLoading,
      login,
      register,
      setAuthSession,
      logout,
      refreshProfile,
      updateAvatar,
    ],
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
