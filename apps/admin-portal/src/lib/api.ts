import {
  AuthResponseDto,
  ChangePasswordDto,
  LoginDto,
  UserListItemDto,
  UserProfile,
  UsersStatsDto,
  NavigationItemDto,
  CreateNavigationItemDto,
  UpdateNavigationItemDto,
  ReorderNavigationItemsDto,
  TargetApp,
} from '@smartfeed/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('smartfeed_admin_token');
  }

  public setToken(token: string | null): void {
    if (typeof window === 'undefined') return;
    if (token) {
      localStorage.setItem('smartfeed_admin_token', token);
    } else {
      localStorage.removeItem('smartfeed_admin_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Auth Endpoints
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const data = await this.request<AuthResponseDto>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    if (data?.tokens?.accessToken) {
      this.setToken(data.tokens.accessToken);
    }
    return data;
  }

  async getMe(): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/me');
  }

  async changePassword(dto: ChangePasswordDto): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  // Users Endpoints
  async getUsers(params?: {
    search?: string;
    role?: string;
    limit?: number;
    offset?: number;
  }): Promise<UserListItemDto[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.role) query.set('role', params.role);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    const qs = query.toString();
    return this.request<UserListItemDto[]>(`/users${qs ? `?${qs}` : ''}`);
  }

  async getUsersStats(): Promise<UsersStatsDto> {
    return this.request<UsersStatsDto>('/users/stats');
  }

  // Navigation Endpoints
  async getAdminNavigationItems(app?: TargetApp): Promise<NavigationItemDto[]> {
    const qs = app ? `?app=${app}` : '';
    return this.request<NavigationItemDto[]>(`/navigation/admin${qs}`);
  }

  async createNavigationItem(dto: CreateNavigationItemDto): Promise<NavigationItemDto> {
    return this.request<NavigationItemDto>('/navigation', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateNavigationItem(id: string, dto: UpdateNavigationItemDto): Promise<NavigationItemDto> {
    return this.request<NavigationItemDto>(`/navigation/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async deleteNavigationItem(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/navigation/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderNavigationItems(dto: ReorderNavigationItemsDto): Promise<any> {
    return this.request<any>('/navigation/reorder', {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }
}

export const api = new ApiClient();
