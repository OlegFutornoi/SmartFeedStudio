import { CurrencyCode, type LiveBankRateDto } from '@smartfeed/shared';
import type { MockDbState } from '@/services/local-db/mock/mock-state';

export function getLocalBankRates(state: MockDbState, currency?: string): LiveBankRateDto[] {
  const all = Array.from(state.bankRates.values());
  if (!currency) {
    return all.sort((a, b) => a.currency.localeCompare(b.currency) || a.sellRate - b.sellRate);
  }
  return all.filter((r) => r.currency === currency).sort((a, b) => a.sellRate - b.sellRate);
}

export function saveLocalBankRates(state: MockDbState, rates: LiveBankRateDto[]): void {
  for (const rate of rates) {
    const key = `${rate.bankId}_${rate.currency}`;
    state.bankRates.set(key, { ...rate });
  }
}

export function seedInitialBankRates(state: MockDbState): void {
  const now = new Date().toISOString();
  const initialRates: LiveBankRateDto[] = [
    // USD
    {
      bankId: 'nbu',
      bankName: 'НБУ',
      badge: 'Офіційний курс',
      logoUrl: '/logos/banks/nbu.svg',
      currency: CurrencyCode.USD,
      buyRate: 41.35,
      sellRate: 41.35,
      deltaNbu: 0,
      deltaPercent: 0,
      updatedAt: now,
      isDefault: true,
    },
    {
      bankId: 'privat',
      bankName: 'ПриватБанк',
      badge: 'Картковий курс',
      logoUrl: '/logos/banks/privat.svg',
      currency: CurrencyCode.USD,
      buyRate: 41.25,
      sellRate: 41.75,
      deltaNbu: 0.4,
      deltaPercent: 0.97,
      updatedAt: now,
    },
    {
      bankId: 'mono',
      bankName: 'Monobank',
      badge: 'Курс у додатку',
      logoUrl: '/logos/banks/mono.svg',
      currency: CurrencyCode.USD,
      buyRate: 41.3,
      sellRate: 41.7,
      deltaNbu: 0.35,
      deltaPercent: 0.85,
      updatedAt: now,
    },
    {
      bankId: 'raiffeisen',
      bankName: 'Райффайзен',
      badge: 'Комерційний',
      logoUrl: '/logos/banks/raiffeisen.svg',
      currency: CurrencyCode.USD,
      buyRate: 41.2,
      sellRate: 41.8,
      deltaNbu: 0.45,
      deltaPercent: 1.09,
      updatedAt: now,
    },
    {
      bankId: 'pumb',
      bankName: 'ПУМБ',
      badge: 'ЗЕД / Безготівка',
      logoUrl: '/logos/banks/pumb.svg',
      currency: CurrencyCode.USD,
      buyRate: 41.25,
      sellRate: 41.8,
      deltaNbu: 0.45,
      deltaPercent: 1.09,
      updatedAt: now,
    },
    // EUR
    {
      bankId: 'nbu',
      bankName: 'НБУ',
      badge: 'Офіційний курс',
      logoUrl: '/logos/banks/nbu.svg',
      currency: CurrencyCode.EUR,
      buyRate: 44.8,
      sellRate: 44.8,
      deltaNbu: 0,
      deltaPercent: 0,
      updatedAt: now,
      isDefault: true,
    },
    {
      bankId: 'privat',
      bankName: 'ПриватБанк',
      badge: 'Картковий курс',
      logoUrl: '/logos/banks/privat.svg',
      currency: CurrencyCode.EUR,
      buyRate: 44.5,
      sellRate: 45.2,
      deltaNbu: 0.4,
      deltaPercent: 0.89,
      updatedAt: now,
    },
    {
      bankId: 'mono',
      bankName: 'Monobank',
      badge: 'Курс у додатку',
      logoUrl: '/logos/banks/mono.svg',
      currency: CurrencyCode.EUR,
      buyRate: 44.55,
      sellRate: 45.15,
      deltaNbu: 0.35,
      deltaPercent: 0.78,
      updatedAt: now,
    },
    {
      bankId: 'raiffeisen',
      bankName: 'Райффайзен',
      badge: 'Комерційний',
      logoUrl: '/logos/banks/raiffeisen.svg',
      currency: CurrencyCode.EUR,
      buyRate: 44.4,
      sellRate: 45.3,
      deltaNbu: 0.5,
      deltaPercent: 1.12,
      updatedAt: now,
    },
    {
      bankId: 'pumb',
      bankName: 'ПУМБ',
      badge: 'ЗЕД / Безготівка',
      logoUrl: '/logos/banks/pumb.svg',
      currency: CurrencyCode.EUR,
      buyRate: 44.45,
      sellRate: 45.25,
      deltaNbu: 0.45,
      deltaPercent: 1.0,
      updatedAt: now,
    },
    // PLN
    {
      bankId: 'nbu',
      bankName: 'НБУ',
      badge: 'Офіційний курс',
      logoUrl: '/logos/banks/nbu.svg',
      currency: CurrencyCode.PLN,
      buyRate: 10.45,
      sellRate: 10.45,
      deltaNbu: 0,
      deltaPercent: 0,
      updatedAt: now,
      isDefault: true,
    },
    {
      bankId: 'privat',
      bankName: 'ПриватБанк',
      badge: 'Картковий курс',
      logoUrl: '/logos/banks/privat.svg',
      currency: CurrencyCode.PLN,
      buyRate: 10.35,
      sellRate: 10.7,
      deltaNbu: 0.25,
      deltaPercent: 2.39,
      updatedAt: now,
    },
  ];

  saveLocalBankRates(state, initialRates);
}
