import type { AuthResponseDto } from '@smartfeed/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export class BaseApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  public getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('smartfeed_admin_token');
  }

  public getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('smartfeed_admin_refresh_token');
  }

  public setToken(token: string | null, refreshToken?: string | null): void {
    if (typeof window === 'undefined') return;
    if (token) {
      localStorage.setItem('smartfeed_admin_token', token);
    } else {
      localStorage.removeItem('smartfeed_admin_token');
    }
    if (refreshToken !== undefined) {
      if (refreshToken) {
        localStorage.setItem('smartfeed_admin_refresh_token', refreshToken);
      } else {
        localStorage.removeItem('smartfeed_admin_refresh_token');
      }
    }
  }

  private async refreshSession(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          this.setToken(null, null);
          return null;
        }

        const data: AuthResponseDto = await response.json();
        if (data.tokens?.accessToken) {
          this.setToken(data.tokens.accessToken, data.tokens.refreshToken || null);
          return data.tokens.accessToken;
        }
        return null;
      } catch (err) {
        console.warn('[admin-api:refreshSession] Session refresh failed:', err);
        return null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private inFlightRequests = new Map<string, Promise<unknown>>();

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();

    // Deduplicate concurrent in-flight GET requests
    if (method === 'GET') {
      const token = this.getToken();
      const cacheKey = `${token || 'anon'}:${endpoint}`;
      const existing = this.inFlightRequests.get(cacheKey);
      if (existing) {
        return existing as Promise<T>;
      }

      const promise = this.executeRequest<T>(endpoint, options).finally(() => {
        this.inFlightRequests.delete(cacheKey);
      });

      this.inFlightRequests.set(cacheKey, promise);
      return promise;
    }

    return this.executeRequest<T>(endpoint, options);
  }

  private async executeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
      const newToken = await this.refreshSession();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
      }
    }

    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined' && endpoint !== '/auth/login') {
        this.setToken(null, null);
        window.dispatchEvent(new CustomEvent('smartfeed_auth_unauthorized'));
      }

      const isEn =
        typeof window !== 'undefined' && localStorage.getItem('smartfeed_admin_lang') === 'en';
      let errorMessage = isEn
        ? 'Something went wrong. Please try again.'
        : 'Щось пішло не так. Спробуйте знову.';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (err) {
        console.warn('[admin-api:request] Failed to parse error JSON:', err);
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Return empty object for 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }
}

export const baseClient = new BaseApiClient();
