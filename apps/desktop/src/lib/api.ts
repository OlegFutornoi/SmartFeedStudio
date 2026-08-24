import type { AuthResponseDto, UserProfile, Role, NavigationItemDto } from '@smartfeed/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  fullName?: string;
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

  return data as AuthResponseDto;
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

  return data as AuthResponseDto;
}

export async function getCurrentUser(token: string): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || 'Не вдалося завантажити профіль користувача';
    throw new ApiError(message, response.status, data);
  }

  return data as UserProfile;
}

export async function getDesktopNavigation(token: string): Promise<NavigationItemDto[]> {
  const response = await fetch(`${API_BASE_URL}/navigation?app=DESKTOP`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => []);

  if (!response.ok) {
    return [];
  }

  return data as NavigationItemDto[];
}
