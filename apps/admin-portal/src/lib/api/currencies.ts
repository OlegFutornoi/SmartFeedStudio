import type {
  BankProviderConfigDto,
  UpdateBankProviderDto,
  LiveBankRateDto,
  CurrencyCode,
} from '@smartfeed/shared';
import { baseClient } from '@/lib/api/client';

export async function getBankProviders(): Promise<BankProviderConfigDto[]> {
  return baseClient.request<BankProviderConfigDto[]>('/admin/currencies/providers');
}

export async function updateBankProvider(
  id: string,
  dto: UpdateBankProviderDto,
): Promise<BankProviderConfigDto> {
  return baseClient.request<BankProviderConfigDto>(`/admin/currencies/providers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function syncCurrencyRates(): Promise<{ synced: boolean; timestamp: string }> {
  return baseClient.request<{ synced: boolean; timestamp: string }>('/admin/currencies/sync', {
    method: 'POST',
  });
}

export async function getLiveBankRates(
  currency: CurrencyCode = 'USD' as CurrencyCode,
): Promise<LiveBankRateDto[]> {
  return baseClient.request<LiveBankRateDto[]>(`/currencies/banks?currency=${currency}`);
}
