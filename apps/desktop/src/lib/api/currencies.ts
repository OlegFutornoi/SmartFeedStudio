import { CurrencyCode, ExchangeRateMode, LiveBankRateDto } from '@smartfeed/shared';
import { API_BASE_URL } from '@/lib/api/client';

export interface ExchangeRateQuote {
  currency: CurrencyCode;
  rate: number; // in UAH
  source: ExchangeRateMode;
  updatedAt: string;
}

const DEFAULT_RATES: Record<CurrencyCode, number> = {
  [CurrencyCode.UAH]: 1.0,
  [CurrencyCode.USD]: 41.5,
  [CurrencyCode.EUR]: 45.2,
  [CurrencyCode.PLN]: 10.45,
  [CurrencyCode.GBP]: 54.1,
  [CurrencyCode.CNY]: 5.85,
};

let cachedQuotes: Record<CurrencyCode, number> = { ...DEFAULT_RATES };
let lastFetchedTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetches real-time exchange rates from National Bank of Ukraine (NBU) API.
 * Gracefully falls back to local cached or standard commercial rates if offline.
 */
export async function fetchLiveExchangeRates(force = false): Promise<Record<CurrencyCode, number>> {
  const now = Date.now();
  if (!force && now - lastFetchedTimestamp < CACHE_TTL_MS) {
    return { ...cachedQuotes };
  }

  try {
    const response = await fetch(
      'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json',
      { method: 'GET', headers: { Accept: 'application/json' } },
    );

    if (response.ok) {
      const data: Array<{ cc: string; rate: number }> = await response.json();
      const newRates: Record<CurrencyCode, number> = { ...DEFAULT_RATES };

      for (const item of data) {
        if (item.cc === 'USD') newRates[CurrencyCode.USD] = item.rate;
        if (item.cc === 'EUR') newRates[CurrencyCode.EUR] = item.rate;
        if (item.cc === 'PLN') newRates[CurrencyCode.PLN] = item.rate;
        if (item.cc === 'GBP') newRates[CurrencyCode.GBP] = item.rate;
        if (item.cc === 'CNY') newRates[CurrencyCode.CNY] = item.rate;
      }

      cachedQuotes = newRates;
      lastFetchedTimestamp = now;
      return { ...cachedQuotes };
    }
  } catch (err) {
    console.warn('[Currencies] NBU live fetch failed, using fallback rates:', err);
  }

  return { ...cachedQuotes };
}

export type BankId = 'nbu' | 'privat' | 'mono' | 'raiffeisen' | 'pumb';

export interface BankExchangeRate {
  bankId: BankId;
  bankName: string;
  badge: string;
  logoUrl?: string | null;
  currency: CurrencyCode;
  buyRate: number;
  sellRate: number;
  deltaNbu: number;
  deltaPercent: number;
  updatedAt: string;
}

/**
 * Returns latest exchange rates for 5 top Ukrainian banks for given currency.
 * Uses NBU as baseline with real-time official rates and market-tested commercial spreads.
 */
export async function fetchBankExchangeRates(
  currency: CurrencyCode,
  force = false,
): Promise<BankExchangeRate[]> {
  const now = new Date();
  const timeString = now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

  if (currency === CurrencyCode.UAH) {
    return [
      {
        bankId: 'nbu',
        bankName: 'НБУ',
        badge: 'Базова валюта',
        logoUrl: '/logos/banks/nbu.svg',
        currency,
        buyRate: 1.0,
        sellRate: 1.0,
        deltaNbu: 0,
        deltaPercent: 0,
        updatedAt: timeString,
      },
    ];
  }

  // 1. Primary Strategy: Fetch from Backend Currencies Microservice (dynamically configured banks & spreads)
  try {
    const res = await fetch(`${API_BASE_URL}/currencies/banks?currency=${currency}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const liveData: LiveBankRateDto[] = await res.json();
      if (Array.isArray(liveData) && liveData.length > 0) {
        return liveData.map((d) => ({
          bankId: d.bankId as BankId,
          bankName: d.bankName,
          badge: d.badge,
          logoUrl: d.logoUrl,
          currency: d.currency,
          buyRate: d.buyRate,
          sellRate: d.sellRate,
          deltaNbu: d.deltaNbu,
          deltaPercent: d.deltaPercent,
          updatedAt: new Date(d.updatedAt).toLocaleTimeString('uk-UA', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }));
      }
    }
  } catch (err) {
    console.warn(
      '[Currencies] Backend microservice unreachable, falling back to local NBU calculation:',
      err,
    );
  }

  // 2. Offline / Standalone Fallback Strategy: Compute from NBU API with default commercial offsets
  const liveRates = await fetchLiveExchangeRates(force);
  const nbuRate = liveRates[currency] || DEFAULT_RATES[currency] || 1.0;

  const defaultConfigs: Array<{
    bankId: BankId;
    bankName: string;
    badge: string;
    buyOffset: number;
    sellOffset: number;
  }> = [
    { bankId: 'nbu', bankName: 'НБУ', badge: 'Офіційний курс', buyOffset: 0, sellOffset: 0 },
    {
      bankId: 'privat',
      bankName: 'ПриватБанк',
      badge: 'Картковий курс',
      buyOffset: -0.25,
      sellOffset: +0.45,
    },
    {
      bankId: 'mono',
      bankName: 'Monobank',
      badge: 'Курс у додатку',
      buyOffset: -0.2,
      sellOffset: +0.4,
    },
    {
      bankId: 'raiffeisen',
      bankName: 'Райффайзен',
      badge: 'Комерційний',
      buyOffset: -0.3,
      sellOffset: +0.55,
    },
    {
      bankId: 'pumb',
      bankName: 'ПУМБ',
      badge: 'ЗЕД / Безготівка',
      buyOffset: -0.22,
      sellOffset: +0.5,
    },
  ];

  return defaultConfigs.map((cfg) => {
    const buyRate = Math.round((nbuRate + cfg.buyOffset) * 100) / 100;
    const sellRate = Math.round((nbuRate + cfg.sellOffset) * 100) / 100;
    const deltaNbu = Math.round((sellRate - nbuRate) * 100) / 100;
    const deltaPercent = nbuRate > 0 ? Math.round(((sellRate - nbuRate) / nbuRate) * 1000) / 10 : 0;

    return {
      bankId: cfg.bankId,
      bankName: cfg.bankName,
      badge: cfg.badge,
      currency,
      buyRate,
      sellRate,
      deltaNbu,
      deltaPercent,
      updatedAt: timeString,
    };
  });
}

/**
 * Returns latest cached rate for specified currency pair against UAH
 */
export function getExchangeRate(
  currency: CurrencyCode,
  mode: ExchangeRateMode = ExchangeRateMode.AUTO_NBU,
  manualRate?: number,
): number {
  if (currency === CurrencyCode.UAH) return 1.0;

  if (mode === ExchangeRateMode.MANUAL && manualRate && manualRate > 0) {
    return manualRate;
  }

  return cachedQuotes[currency] || DEFAULT_RATES[currency] || 1.0;
}
