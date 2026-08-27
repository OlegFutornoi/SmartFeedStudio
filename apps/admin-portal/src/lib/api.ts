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
  TariffPlanDto,
  CreateTariffPlanDto,
  UpdateTariffPlanDto,
  AdminLicenseItemDto,
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
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined' && endpoint !== '/auth/login') {
        localStorage.removeItem('smartfeed_admin_token');
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
      } catch {
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

  // Auth Endpoints
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const res = await this.request<AuthResponseDto>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    if (res.tokens?.accessToken) {
      this.setToken(res.tokens.accessToken);
    }
    return res;
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

  async reorderNavigationItems(dto: ReorderNavigationItemsDto): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/navigation/reorder', {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  // Tariff Plans Endpoints
  async getTariffPlans(currency?: string): Promise<TariffPlanDto[]> {
    const qs = currency ? `?currency=${currency}` : '';
    return this.request<TariffPlanDto[]>(`/plans${qs}`);
  }

  async getAdminTariffPlans(): Promise<TariffPlanDto[]> {
    return this.request<TariffPlanDto[]>('/plans/admin');
  }

  async createTariffPlan(dto: CreateTariffPlanDto): Promise<TariffPlanDto> {
    return this.request<TariffPlanDto>('/plans', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateTariffPlan(id: string, dto: UpdateTariffPlanDto): Promise<TariffPlanDto> {
    return this.request<TariffPlanDto>(`/plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async deleteTariffPlan(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/plans/${id}`, {
      method: 'DELETE',
    });
  }

  // Licenses Endpoints
  async getAdminLicenses(): Promise<AdminLicenseItemDto[]> {
    return this.request<AdminLicenseItemDto[]>('/licenses/admin');
  }
}

export const api = new ApiClient();
