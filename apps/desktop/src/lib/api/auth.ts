import type { AuthResponseDto, UserProfile, Role, NavigationItemDto } from '@smartfeed/shared';
import {
  API_BASE_URL,
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  ApiError,
  fetchWithAuth,
} from './client';

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

export interface InvitationDetails {
  id: string;
  email: string;
  organizationName: string;
  role: string;
  expiresAt: string;
  isExistingUser?: boolean;
  inviterName?: string | null;
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
