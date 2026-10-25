import { CurrencyCode, ExchangeRateMode, LiveBankRateDto } from '@smartfeed/shared';
import { localDb } from '@/services/local-db';
import { syncLiveCurrencyRates } from '@/services/currency/app-currency-sync.service';

export interface ExchangeRateQuote {
  currency: CurrencyCode;
  rate: number; // in UAH
  source: ExchangeRateMode;
  updatedAt: string;
}

export const DEFAULT_RATES: Record<CurrencyCode, number> = {
  [CurrencyCode.UAH]: 1.0,
  [CurrencyCode.USD]: 0,
  [CurrencyCode.EUR]: 0,
  [CurrencyCode.PLN]: 0,
  [CurrencyCode.GBP]: 0,
  [CurrencyCode.CNY]: 0,
};

let cachedQuotes: Record<CurrencyCode, number> = { ...DEFAULT_RATES, [CurrencyCode.UAH]: 1.0 };
let lastFetchedTimestamp = 0;
let inFlightLiveRatesPromise: Promise<Record<CurrencyCode, number>> | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

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

function mapLiveDtoToBankRate(d: LiveBankRateDto): BankExchangeRate {
  let timeString = '';
  try {
    timeString = new Date(d.updatedAt).toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    timeString = d.updatedAt;
  }

  return {
    bankId: d.bankId as BankId,
    bankName: d.bankName,
    badge: d.badge,
    logoUrl: d.logoUrl,
    currency: d.currency as CurrencyCode,
    buyRate: d.buyRate,
    sellRate: d.sellRate,
    deltaNbu: d.deltaNbu,
    deltaPercent: d.deltaPercent,
    updatedAt: timeString,
  };
}

/**
 * Fetches real-time exchange rates from local database table local_bank_rates.
 * If empty or force=true, triggers background sync from official NBU API.
 * Eliminates all hardcoded fallback rates (e.g. 41.5).
 */
export async function fetchLiveExchangeRates(force = false): Promise<Record<CurrencyCode, number>> {
  const now = Date.now();
  if (!force && now - lastFetchedTimestamp < CACHE_TTL_MS && cachedQuotes[CurrencyCode.USD] > 0) {
    return { ...cachedQuotes };
  }

  if (!force && inFlightLiveRatesPromise) {
    return inFlightLiveRatesPromise;
  }

  inFlightLiveRatesPromise = (async () => {
    try {
      let localRates = await localDb.currencies.getBankRates();
      if (localRates.length === 0 || force) {
        localRates = await syncLiveCurrencyRates(force);
      }

      const newRates: Record<CurrencyCode, number> = { ...DEFAULT_RATES, [CurrencyCode.UAH]: 1.0 };
      for (const r of localRates) {
        const curr = r.currency as CurrencyCode;
        if (r.bankId === 'nbu') {
          newRates[curr] = r.sellRate;
        } else if (!newRates[curr] || newRates[curr] === 0) {
          newRates[curr] = r.sellRate;
        }
      }

      cachedQuotes = newRates;
      lastFetchedTimestamp = Date.now();
      return { ...cachedQuotes };
    } catch (err) {
      console.warn('[Currencies] fetchLiveExchangeRates failed:', err);
      return { ...cachedQuotes };
    } finally {
      inFlightLiveRatesPromise = null;
    }
  })();

  return inFlightLiveRatesPromise;
}

/**
 * Returns latest exchange rates for 5 top Ukrainian banks for given currency from local_bank_rates table.
 * If local table is empty, syncs from NBU first. Zero hardcoded rates.
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

  try {
    let localRates = await localDb.currencies.getBankRates(currency);
    if (localRates.length === 0 || force) {
      const synced = await syncLiveCurrencyRates(force);
      localRates = synced.filter((s) => s.currency === currency);
    }

    if (localRates.length > 0) {
      const mapped = localRates.map(mapLiveDtoToBankRate);
      const nbuEntry = mapped.find((b) => b.bankId === 'nbu');
      if (nbuEntry && nbuEntry.sellRate > 0) {
        cachedQuotes[currency] = nbuEntry.sellRate;
      }
      return mapped;
    }
  } catch (err) {
    console.warn('[Currencies] fetchBankExchangeRates error, reading fallback from localDb:', err);
  }

  // Graceful fallback from localDb without network
  const fallback = await localDb.currencies.getBankRates(currency);
  return fallback.map(mapLiveDtoToBankRate);
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

  return cachedQuotes[currency] || 1.0;
}
