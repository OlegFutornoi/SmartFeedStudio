import type { TariffPlanDto, CreateTariffPlanDto, UpdateTariffPlanDto } from '@smartfeed/shared';
import { baseClient } from './client';

export async function getTariffPlans(currency?: string): Promise<TariffPlanDto[]> {
  const qs = currency ? `?currency=${currency}` : '';
  return baseClient.request<TariffPlanDto[]>(`/plans${qs}`);
}

export async function getAdminTariffPlans(): Promise<TariffPlanDto[]> {
  return baseClient.request<TariffPlanDto[]>('/plans/admin');
}

export async function createTariffPlan(dto: CreateTariffPlanDto): Promise<TariffPlanDto> {
  return baseClient.request<TariffPlanDto>('/plans', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateTariffPlan(
  id: string,
  dto: UpdateTariffPlanDto,
): Promise<TariffPlanDto> {
  return baseClient.request<TariffPlanDto>(`/plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function deleteTariffPlan(id: string): Promise<{ success: boolean }> {
  return baseClient.request<{ success: boolean }>(`/plans/${id}`, {
    method: 'DELETE',
  });
}
