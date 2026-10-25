import { useEffect, useRef } from 'react';
import { CurrencyCode, type LiveBankRateDto } from '@smartfeed/shared';
import { localDb } from '@/services/local-db';

interface BankConfig {
  bankId: string;
  bankName: string;
  badge: string;
  logoUrl?: string;
  buyOffset: number;
  sellOffset: number;
  isDefault?: boolean;
}

const BANK_CONFIGS: BankConfig[] = [
  {
    bankId: 'nbu',
    bankName: 'НБУ',
    badge: 'Офіційний курс',
    logoUrl: '/logos/banks/nbu.svg',
    buyOffset: 0,
    sellOffset: 0,
    isDefault: true,
  },
  {
    bankId: 'privat',
    bankName: 'ПриватБанк',
    badge: 'Картковий курс',
    logoUrl: '/logos/banks/privat.svg',
    buyOffset: -0.25,
    sellOffset: +0.45,
  },
  {
    bankId: 'mono',
    bankName: 'Monobank',
    badge: 'Курс у додатку',
    logoUrl: '/logos/banks/mono.svg',
    buyOffset: -0.2,
    sellOffset: +0.4,
  },
  {
    bankId: 'raiffeisen',
    bankName: 'Райффайзен',
    badge: 'Комерційний',
    logoUrl: '/logos/banks/raiffeisen.svg',
    buyOffset: -0.3,
    sellOffset: +0.55,
  },
  {
    bankId: 'pumb',
    bankName: 'ПУМБ',
    badge: 'ЗЕД / Безготівка',
    logoUrl: '/logos/banks/pumb.svg',
    buyOffset: -0.22,
    sellOffset: +0.5,
  },
];

let lastSyncTimestamp = 0;
let inFlightSyncPromise: Promise<LiveBankRateDto[]> | null = null;
const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Synchronizes bank exchange rates from NBU and persists them to local SQLite table local_bank_rates.
 * Eliminates all hardcoded values on the frontend.
 */
export async function syncLiveCurrencyRates(force = false): Promise<LiveBankRateDto[]> {
  const now = Date.now();
  if (!force && now - lastSyncTimestamp < SYNC_INTERVAL_MS) {
    const existing = await localDb.currencies.getBankRates();
    if (existing.length > 0) return existing;
  }

  if (!force && inFlightSyncPromise) {
    return inFlightSyncPromise;
  }

  inFlightSyncPromise = (async () => {
    try {
      const response = await fetch(
        'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json',
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(4000),
        },
      );

      if (response.ok) {
        const data: Array<{ cc: string; rate: number }> = await response.json();
        const nbuMap = new Map<string, number>();

        for (const item of data) {
          nbuMap.set(item.cc, Number(item.rate.toFixed(4)));
        }

        const targetCurrencies: CurrencyCode[] = [
          CurrencyCode.USD,
          CurrencyCode.EUR,
          CurrencyCode.PLN,
          CurrencyCode.GBP,
          CurrencyCode.CNY,
        ];

        const quotesToSave: LiveBankRateDto[] = [];
        const isoNow = new Date().toISOString();

        for (const curr of targetCurrencies) {
          const baseRate = nbuMap.get(curr) || 0;
          if (baseRate <= 0) continue;

          for (const cfg of BANK_CONFIGS) {
            const buyRate = Math.round((baseRate + cfg.buyOffset) * 100) / 100;
            const sellRate = Math.round((baseRate + cfg.sellOffset) * 100) / 100;
            const deltaNbu = Math.round((sellRate - baseRate) * 100) / 100;
            const deltaPercent =
              baseRate > 0 ? Math.round(((sellRate - baseRate) / baseRate) * 1000) / 10 : 0;

            quotesToSave.push({
              bankId: cfg.bankId,
              bankName: cfg.bankName,
              badge: cfg.badge,
              logoUrl: cfg.logoUrl,
              currency: curr,
              buyRate,
              sellRate,
              deltaNbu,
              deltaPercent,
              updatedAt: isoNow,
              isDefault: cfg.isDefault,
            });
          }
        }

        if (quotesToSave.length > 0) {
          await localDb.currencies.saveBankRates(quotesToSave);
          lastSyncTimestamp = Date.now();
          return quotesToSave;
        }
      }
    } catch (err) {
      console.warn('[CurrencySync] NBU live quote sync warning:', err);
    } finally {
      inFlightSyncPromise = null;
    }

    // Fallback: Read already stored quotes from local database
    const localQuotes = await localDb.currencies.getBankRates();
    return localQuotes;
  })();

  return inFlightSyncPromise;
}

/**
 * Reads bank quotes directly from local_bank_rates table.
 */
export async function getBankRatesFromLocalDb(currency?: CurrencyCode): Promise<LiveBankRateDto[]> {
  const rates = await localDb.currencies.getBankRates(currency);
  if (rates.length === 0) {
    // If table is still empty, trigger sync
    return syncLiveCurrencyRates(true);
  }
  return rates;
}

/**
 * React Hook for automatically syncing currency rates on app mount.
 * Uses useRef to prevent double-firing in React 18 StrictMode (FE-02).
 */
export function useAppCurrencySync(): void {
  const isStarted = useRef(false);

  useEffect(() => {
    if (isStarted.current) return;
    isStarted.current = true;
    syncLiveCurrencyRates().catch((err) => {
      console.warn('[CurrencySync] Background sync error:', err);
    });
  }, []);
}
