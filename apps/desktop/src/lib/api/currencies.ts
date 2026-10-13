import { CurrencyCode, ExchangeRateMode } from '@smartfeed/shared';

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
