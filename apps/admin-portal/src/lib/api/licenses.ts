import type { AdminLicenseItemDto } from '@smartfeed/shared';
import { baseClient } from './client';

export async function getAdminLicenses(): Promise<AdminLicenseItemDto[]> {
  return baseClient.request<AdminLicenseItemDto[]>('/licenses/admin');
}

export async function updateLicenseStatus(
  id: string,
  isActive: boolean,
): Promise<AdminLicenseItemDto> {
  return baseClient.request<AdminLicenseItemDto>(`/licenses/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export async function deleteLicense(id: string): Promise<{ success: boolean }> {
  return baseClient.request<{ success: boolean }>(`/licenses/${id}`, {
    method: 'DELETE',
  });
}
