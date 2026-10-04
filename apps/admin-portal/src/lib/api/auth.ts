import type { AuthResponseDto, ChangePasswordDto, LoginDto, UserProfile } from '@smartfeed/shared';
import { baseClient } from '@/lib/api/client';

export async function login(dto: LoginDto): Promise<AuthResponseDto> {
  const res = await baseClient.request<AuthResponseDto>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  if (res.tokens?.accessToken) {
    baseClient.setToken(res.tokens.accessToken, res.tokens.refreshToken || null);
  }
  return res;
}

export async function getMe(): Promise<UserProfile> {
  return baseClient.request<UserProfile>('/auth/me');
}

export async function changePassword(
  dto: ChangePasswordDto,
): Promise<{ success: boolean; message: string }> {
  return baseClient.request<{ success: boolean; message: string }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateAvatar(avatarUrl: string | null): Promise<UserProfile> {
  return baseClient.request<UserProfile>('/auth/avatar', {
    method: 'PATCH',
    body: JSON.stringify({ avatarUrl: avatarUrl || null }),
  });
}
