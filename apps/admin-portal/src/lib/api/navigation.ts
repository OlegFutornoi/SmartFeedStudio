import type {
  NavigationItemDto,
  CreateNavigationItemDto,
  UpdateNavigationItemDto,
  ReorderNavigationItemsDto,
  TargetApp,
} from '@smartfeed/shared';
import { baseClient } from '@/lib/api/client';

export async function getNavigation(app?: TargetApp): Promise<NavigationItemDto[]> {
  const qs = app ? `?app=${app}` : '';
  return baseClient.request<NavigationItemDto[]>(`/navigation${qs}`);
}

export async function getAdminNavigationItems(app?: TargetApp): Promise<NavigationItemDto[]> {
  const qs = app ? `?app=${app}` : '';
  return baseClient.request<NavigationItemDto[]>(`/navigation/admin${qs}`);
}

export async function createNavigationItem(
  dto: CreateNavigationItemDto,
): Promise<NavigationItemDto> {
  return baseClient.request<NavigationItemDto>('/navigation', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateNavigationItem(
  id: string,
  dto: UpdateNavigationItemDto,
): Promise<NavigationItemDto> {
  return baseClient.request<NavigationItemDto>(`/navigation/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function deleteNavigationItem(id: string): Promise<{ success: boolean }> {
  return baseClient.request<{ success: boolean }>(`/navigation/${id}`, {
    method: 'DELETE',
  });
}

export async function reorderNavigationItems(
  dto: ReorderNavigationItemsDto,
): Promise<{ success: boolean }> {
  return baseClient.request<{ success: boolean }>('/navigation/reorder', {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}
