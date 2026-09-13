import type {
  PaymentTransactionDto,
  PaymentSettingDto,
  UpdatePaymentSettingDto,
  PaymentStatsDto,
} from '@smartfeed/shared';
import { baseClient } from './client';

export interface GetPaymentTransactionsParams {
  status?: string;
  provider?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getPaymentTransactions(
  params: GetPaymentTransactionsParams = {},
): Promise<{ transactions: PaymentTransactionDto[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.provider) searchParams.set('provider', params.provider);
  if (params.search) searchParams.set('search', params.search);
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));

  const qs = searchParams.toString();
  return baseClient.request<{ transactions: PaymentTransactionDto[]; total: number }>(
    `/payments/transactions${qs ? `?${qs}` : ''}`,
  );
}

export async function getPaymentStats(): Promise<PaymentStatsDto> {
  return baseClient.request<PaymentStatsDto>('/payments/stats');
}

export async function getPaymentSettings(): Promise<PaymentSettingDto[]> {
  return baseClient.request<PaymentSettingDto[]>('/payments/settings');
}

export async function updatePaymentSetting(
  provider: string,
  dto: UpdatePaymentSettingDto,
): Promise<PaymentSettingDto> {
  return baseClient.request<PaymentSettingDto>(`/payments/settings/${provider}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}
