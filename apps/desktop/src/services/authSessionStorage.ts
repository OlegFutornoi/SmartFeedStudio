import type { UserProfile } from '@smartfeed/shared';
import { TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from '@/lib/api';
import { mockDatabaseDriver } from '@/services/local-db/mock-driver';
import { emitDataSync } from '@/lib/syncEvents';

export const authSessionStorage = {
  getInitialToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  getInitialUser(): UserProfile | null {
    const saved = localStorage.getItem(USER_KEY);
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved) as UserProfile;
      if (parsed?.id) {
        mockDatabaseDriver.switchUser(parsed.id);
      }
      return parsed;
    } catch (e) {
      console.warn('[authSessionStorage] Failed to parse saved user:', e);
      return null;
    }
  },

  getInitialSuspended(): boolean {
    const saved = localStorage.getItem(USER_KEY);
    if (!saved) return false;
    try {
      const parsed = JSON.parse(saved) as UserProfile;
      return parsed?.isActive === false;
    } catch (err) {
      console.warn('[authSessionStorage] Failed to parse saved user for suspended check:', err);
      return false;
    }
  },

  saveSession(tokens: { accessToken: string; refreshToken?: string }, user: UserProfile): void {
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    if (tokens.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    mockDatabaseDriver.switchUser(user.id);
    emitDataSync(['suppliers', 'feeds', 'products', 'quotas', 'all']);
  },

  saveUser(user: UserProfile): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    mockDatabaseDriver.switchUser(null);
    emitDataSync(['suppliers', 'feeds', 'products', 'quotas', 'all']);
  },
};
