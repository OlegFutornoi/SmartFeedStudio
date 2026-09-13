import type { AuthResponseDto } from '@smartfeed/shared';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const TOKEN_KEY = 'smartfeed_access_token';
export const REFRESH_TOKEN_KEY = 'smartfeed_refresh_token';
export const USER_KEY = 'smartfeed_user_profile';

export class ApiError extends Error {
  statusCode: number;
  data?: unknown;

  constructor(message: string, statusCode: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

// Global Refresh Lock to prevent duplicate concurrent refresh requests
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Transparently refresh the active authentication session using stored Refresh Token.
 */
export async function refreshAuthSession(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return null;
  }

  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // If refresh token is truly expired or invalid, clear stored session
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return null;
      }

      const data: AuthResponseDto = await response.json();
      if (data.tokens?.accessToken) {
        localStorage.setItem(TOKEN_KEY, data.tokens.accessToken);
        if (data.tokens.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, data.tokens.refreshToken);
        }
        if (data.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
        return data.tokens.accessToken;
      }
      return null;
    } catch (err) {
      console.warn('[api:refreshToken] Refresh token request failed:', err);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Authenticated Fetch wrapper with automatic silent 401 token refresh & request retry.
 */
export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
  tokenOverride?: string,
): Promise<Response> {
  const token = tokenOverride || localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If 401 Unauthorized, transparently refresh session and retry request
  if (response.status === 401) {
    const newToken = await refreshAuthSession();
    if (newToken) {
      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: retryHeaders,
      });
    }
  }

  return response;
}
