import type { LicenseEntity, TariffPlanDto, CheckoutResponseDto } from '@smartfeed/shared';
import { API_BASE_URL, ApiError, fetchWithAuth } from '@/lib/api/client';

export async function getMyLicense(token?: string): Promise<LicenseEntity> {
  const response = await fetchWithAuth('/licenses/my', { method: 'GET' }, token);

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || 'Failed to load license status';
    throw new ApiError(message, response.status, data);
  }

  return data as LicenseEntity;
}

export async function getTariffPlans(): Promise<TariffPlanDto[]> {
  const response = await fetch(`${API_BASE_URL}/plans`, {
    method: 'GET',
  });

  const data = await response.json().catch(() => []);

  if (!response.ok) {
    return [];
  }

  return data as TariffPlanDto[];
}

export function getCheckoutUrl(
  planCode: string,
  billingInterval: 'monthly' | 'yearly' = 'monthly',
): string {
  const baseUrl = 'https://checkout.smartfeed.studio/pay';
  const query = new URLSearchParams({
    plan: planCode.toUpperCase(),
    interval: billingInterval,
  });
  return `${baseUrl}?${query.toString()}`;
}

export async function selectTariffPlan(
  token: string,
  planCode: string,
  billingInterval: 'monthly' | 'yearly' = 'monthly',
): Promise<LicenseEntity> {
  const response = await fetchWithAuth(
    '/licenses/select-plan',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planCode, billingInterval }),
    },
    token,
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося обрати тарифний план';
    throw new ApiError(message, response.status, data);
  }

  return data as LicenseEntity;
}

export async function createPaymentCheckout(
  token: string,
  planCode: string,
  billingInterval: 'monthly' | 'yearly' = 'monthly',
): Promise<CheckoutResponseDto> {
  const response = await fetchWithAuth(
    '/payments/checkout',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planCode, billingInterval }),
    },
    token,
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося створити платіжний рахунок';
    throw new ApiError(message, response.status, data);
  }

  return data as CheckoutResponseDto;
}

export async function simulateSandboxPayment(
  token: string,
  orderReference: string,
  status?: 'Approved' | 'Declined',
  reason?: string,
  cardDetails?: { cardPan?: string; cardType?: string; issuerBank?: string },
): Promise<{ success?: boolean; status?: string; [key: string]: unknown }> {
  const response = await fetchWithAuth(
    '/payments/simulate-sandbox-webhook',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderReference,
        status,
        reason,
        cardPan: cardDetails?.cardPan,
        cardType: cardDetails?.cardType,
        issuerBank: cardDetails?.issuerBank,
      }),
    },
    token,
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося виконати тестову симуляцію оплати';
    throw new ApiError(message, response.status, data);
  }
  return data;
}
