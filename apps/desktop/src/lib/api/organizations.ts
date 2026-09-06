import type {
  UserOrganizationDto,
  OrganizationDto,
  OrganizationMemberDto,
  OrganizationInvitationDto,
} from '@smartfeed/shared';
import { ApiError, fetchWithAuth } from './client';

export async function getUserOrganizations(token?: string): Promise<UserOrganizationDto[]> {
  const response = await fetchWithAuth('/organizations', { method: 'GET' }, token);

  const data = await response.json().catch(() => []);
  if (!response.ok) {
    return [];
  }
  return data as UserOrganizationDto[];
}

export async function getOrganizationById(token: string, id: string): Promise<OrganizationDto> {
  const response = await fetchWithAuth(`/organizations/${id}`, { method: 'GET' }, token);

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Failed to get organization details';
    throw new ApiError(message, response.status, data);
  }
  return data as OrganizationDto;
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
): Promise<{ success?: boolean; inviteUrl?: string; [key: string]: unknown }> {
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
): Promise<{ success: boolean }> {
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
): Promise<OrganizationDto> {
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
  return data as OrganizationDto;
}

export async function getOrganizationInvitations(
  token: string,
  id: string,
): Promise<OrganizationInvitationDto[]> {
  const response = await fetchWithAuth(
    `/organizations/${id}/invitations`,
    { method: 'GET' },
    token,
  );

  const data = await response.json().catch(() => []);
  if (!response.ok) {
    return [];
  }
  return data as OrganizationInvitationDto[];
}

export async function revokeOrganizationInvitation(
  token: string,
  id: string,
  invitationId: string,
): Promise<{ success: boolean }> {
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
