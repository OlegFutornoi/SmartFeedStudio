import type { CreateUserByAdminDto, UserListItemDto, UsersStatsDto } from '@smartfeed/shared';
import { baseClient } from './client';

export interface GetUsersParams {
  search?: string;
  role?: string;
  orgRoleFilter?: 'ALL' | 'OWNERS' | 'MEMBERS';
  limit?: number;
  offset?: number;
}

export async function getUsers(params?: GetUsersParams): Promise<UserListItemDto[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.role) query.set('role', params.role);
  if (params?.orgRoleFilter && params.orgRoleFilter !== 'ALL')
    query.set('orgRoleFilter', params.orgRoleFilter);
  if (params?.limit) query.set('limit', params.limit.toString());
  if (params?.offset) query.set('offset', params.offset.toString());

  const qs = query.toString();
  return baseClient.request<UserListItemDto[]>(`/users${qs ? `?${qs}` : ''}`);
}

export async function getUsersStats(): Promise<UsersStatsDto> {
  return baseClient.request<UsersStatsDto>('/users/stats');
}

export async function createUser(dto: CreateUserByAdminDto): Promise<UserListItemDto> {
  return baseClient.request<UserListItemDto>('/users', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateUserStatus(
  userId: string,
  isActive: boolean,
): Promise<UserListItemDto> {
  return baseClient.request<UserListItemDto>(`/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export async function deleteUser(userId: string): Promise<{ success: boolean }> {
  return baseClient.request<{ success: boolean }>(`/users/${userId}`, {
    method: 'DELETE',
  });
}
