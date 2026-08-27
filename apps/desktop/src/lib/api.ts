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

export async function getMyLicense(token: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/licenses/my`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

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

export async function selectTariffPlan(token: string, planCode: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/licenses/select-plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ planCode }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося обрати тарифний план';
    throw new ApiError(message, response.status, data);
  }

  return data;
}

// ==========================================
// Organization & Team Management API
// ==========================================

export async function getUserOrganizations(token: string): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/organizations`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => []);
  if (!response.ok) {
    return [];
  }
  return data;
}

export async function getOrganizationById(token: string, id: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/organizations/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося отримати дані організації';
    throw new ApiError(message, response.status, data);
  }
  return data;
}

export async function getOrganizationMembers(token: string, id: string): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/organizations/${id}/members`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => []);
  if (!response.ok) {
    return [];
  }
  return data;
}

export async function inviteOrganizationMember(
  token: string,
  id: string,
  payload: { email: string; role?: string },
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/organizations/${id}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

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
  const response = await fetch(`${API_BASE_URL}/organizations/${id}/members/${memberId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

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
  const response = await fetch(`${API_BASE_URL}/organizations/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

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
  const response = await fetch(`${API_BASE_URL}/organizations/${id}/invitations`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

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
  const response = await fetch(`${API_BASE_URL}/organizations/${id}/invitations/${invitationId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

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
  return data as AuthResponseDto;
}
