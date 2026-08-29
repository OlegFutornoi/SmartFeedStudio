import type {
  AuthResponseDto,
  UserProfile,
  Role,
  NavigationItemDto,
  CheckoutResponseDto,
  OrganizationMemberDto,
} from '@smartfeed/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const TOKEN_KEY = 'smartfeed_access_token';
export const REFRESH_TOKEN_KEY = 'smartfeed_refresh_token';
export const USER_KEY = 'smartfeed_user_profile';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  fullName?: string;
  companyName?: string;
  role?: Role;
}

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
    } catch {
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

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponseDto> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Помилка авторизації. Перевірте введені дані.';
    throw new ApiError(message, response.status, data);
  }

  const authData = data as AuthResponseDto;
  if (authData.tokens?.accessToken) {
    localStorage.setItem(TOKEN_KEY, authData.tokens.accessToken);
    if (authData.tokens.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, authData.tokens.refreshToken);
    }
    if (authData.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
    }
  }

  return authData;
}

export async function registerUser(credentials: RegisterCredentials): Promise<AuthResponseDto> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Помилка реєстрації. Перевірте введені дані.';
    throw new ApiError(message, response.status, data);
  }

  const authData = data as AuthResponseDto;
  if (authData.tokens?.accessToken) {
    localStorage.setItem(TOKEN_KEY, authData.tokens.accessToken);
    if (authData.tokens.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, authData.tokens.refreshToken);
    }
    if (authData.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
    }
  }

  return authData;
}

export async function getCurrentUser(token?: string): Promise<UserProfile> {
  const response = await fetchWithAuth('/auth/me', { method: 'GET' }, token);

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || 'Не вдалося завантажити профіль користувача';
    throw new ApiError(message, response.status, data);
  }

  return data as UserProfile;
}

export async function getDesktopNavigation(token?: string): Promise<NavigationItemDto[]> {
  const response = await fetchWithAuth('/navigation?app=DESKTOP', { method: 'GET' }, token);

  const data = await response.json().catch(() => []);

  if (!response.ok) {
    return [];
  }

  return data as NavigationItemDto[];
}

export async function requestPasswordReset(
  email: string,
): Promise<{ success: boolean; message: string; resetToken?: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося надіслати запит на відновлення пароля';
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, newPassword }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося встановити новий пароль';
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export async function getMyLicense(token?: string): Promise<any> {
  const response = await fetchWithAuth('/licenses/my', { method: 'GET' }, token);

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || 'Не вдалося завантажити статус ліцензії';
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export async function getTariffPlans(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/plans`, {
    method: 'GET',
  });

  const data = await response.json().catch(() => []);

  if (!response.ok) {
    return [];
  }

  return data;
}

export function getCheckoutUrl(
  planCode: string,
  billingInterval: 'monthly' | 'yearly' = 'monthly',
): string {
  const baseUrl = 'https://checkout.smartfeed.studio/pay';
  const query = new URLSearchParams({
    plan: planCode.toUpperCase(),
    interval: billingInterval,
  });
  return `${baseUrl}?${query.toString()}`;
}

export async function selectTariffPlan(
  token: string,
  planCode: string,
  billingInterval: 'monthly' | 'yearly' = 'monthly',
): Promise<any> {
  const response = await fetchWithAuth(
    '/licenses/select-plan',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planCode, billingInterval }),
    },
    token,
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося обрати тарифний план';
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export async function createPaymentCheckout(
  token: string,
  planCode: string,
  billingInterval: 'monthly' | 'yearly' = 'monthly',
): Promise<CheckoutResponseDto> {
  const response = await fetchWithAuth(
    '/payments/checkout',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planCode, billingInterval }),
    },
    token,
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося створити платіжний рахунок';
    throw new ApiError(message, response.status, data);
  }

  return data as CheckoutResponseDto;
}

export async function simulateSandboxPayment(
  token: string,
  orderReference: string,
  status?: 'Approved' | 'Declined',
  reason?: string,
  cardDetails?: { cardPan?: string; cardType?: string; issuerBank?: string },
): Promise<any> {
  const response = await fetchWithAuth(
    '/payments/simulate-sandbox-webhook',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderReference,
        status,
        reason,
        cardPan: cardDetails?.cardPan,
        cardType: cardDetails?.cardType,
        issuerBank: cardDetails?.issuerBank,
      }),
    },
    token,
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося виконати тестову симуляцію оплати';
    throw new ApiError(message, response.status, data);
  }
  return data;
}

// ==========================================
// Organization & Team Management API
// ==========================================

export async function getUserOrganizations(token?: string): Promise<any[]> {
  const response = await fetchWithAuth('/organizations', { method: 'GET' }, token);

  const data = await response.json().catch(() => []);
  if (!response.ok) {
    return [];
  }
  return data;
}

export async function getOrganizationById(token: string, id: string): Promise<any> {
  const response = await fetchWithAuth(`/organizations/${id}`, { method: 'GET' }, token);

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося отримати дані організації';
    throw new ApiError(message, response.status, data);
  }
  return data;
}

export async function getOrganizationMembers(
  token: string,
  id: string,
): Promise<OrganizationMemberDto[]> {
  const response = await fetchWithAuth(`/organizations/${id}/members`, { method: 'GET' }, token);

  const data = await response.json().catch(() => []);
  if (!response.ok) {
    return [];
  }
  return data as OrganizationMemberDto[];
}

export async function inviteOrganizationMember(
  token: string,
  id: string,
  payload: { email: string; role?: string },
): Promise<any> {
  const response = await fetchWithAuth(
    `/organizations/${id}/members`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    token,
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося запросити учасника';
    throw new ApiError(message, response.status, data);
  }
  return data;
}

export async function removeOrganizationMember(
  token: string,
  id: string,
  memberId: string,
): Promise<any> {
  const response = await fetchWithAuth(
    `/organizations/${id}/members/${memberId}`,
    {
      method: 'DELETE',
    },
    token,
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося видалити учасника';
    throw new ApiError(message, response.status, data);
  }
  return data;
}

export async function updateOrganization(
  token: string,
  id: string,
  payload: { name: string },
): Promise<any> {
  const response = await fetchWithAuth(
    `/organizations/${id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    token,
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося оновити організацію';
    throw new ApiError(message, response.status, data);
  }
  return data;
}

export async function getOrganizationInvitations(token: string, id: string): Promise<any[]> {
  const response = await fetchWithAuth(
    `/organizations/${id}/invitations`,
    { method: 'GET' },
    token,
  );

  const data = await response.json().catch(() => []);
  if (!response.ok) {
    return [];
  }
  return data;
}

export async function revokeOrganizationInvitation(
  token: string,
  id: string,
  invitationId: string,
): Promise<any> {
  const response = await fetchWithAuth(
    `/organizations/${id}/invitations/${invitationId}`,
    {
      method: 'DELETE',
    },
    token,
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося скасувати запрошення';
    throw new ApiError(message, response.status, data);
  }
  return data;
}

export interface InvitationDetails {
  organizationName: string;
  email: string;
  role: string;
  expiresAt: string;
  isExistingUser?: boolean;
  inviterName?: string | null;
}

export async function getInvitationDetails(token: string): Promise<InvitationDetails> {
  const response = await fetch(`${API_BASE_URL}/invitations/${token}`, {
    method: 'GET',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Запрошення не знайдено або термін його дії закінчився';
    throw new ApiError(message, response.status, data);
  }
  return data as InvitationDetails;
}

export async function acceptInvitation(payload: {
  token: string;
  fullName?: string;
  password?: string;
}): Promise<AuthResponseDto> {
  const response = await fetch(`${API_BASE_URL}/invitations/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося прийняти запрошення';
    throw new ApiError(message, response.status, data);
  }

  const authData = data as AuthResponseDto;
  if (authData.tokens?.accessToken) {
    localStorage.setItem(TOKEN_KEY, authData.tokens.accessToken);
    if (authData.tokens.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, authData.tokens.refreshToken);
    }
    if (authData.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
    }
  }

  return authData;
}
