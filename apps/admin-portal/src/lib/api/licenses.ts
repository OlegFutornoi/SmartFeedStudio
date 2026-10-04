import type { AdminLicenseItemDto } from '@smartfeed/shared';
import { baseClient } from '@/lib/api/client';

export interface GetAdminLicensesParams {
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getAdminLicenses(
  params?: GetAdminLicensesParams,
): Promise<AdminLicenseItemDto[]> {
  const query = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params)
          .filter(([_, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : '';
  return baseClient.request<AdminLicenseItemDto[]>(`/licenses/admin${query}`);
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
