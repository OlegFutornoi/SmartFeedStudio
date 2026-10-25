import { invokeLocalDb } from '@/services/local-db/client';
import type { LiveBankRateDto } from '@smartfeed/shared';

export const localCurrenciesService = {
  getBankRates: async (currency?: string): Promise<LiveBankRateDto[]> => {
    return invokeLocalDb('db_get_bank_rates', { currency });
  },

  saveBankRates: async (rates: LiveBankRateDto[]): Promise<void> => {
    return invokeLocalDb('db_save_bank_rates', { rates });
  },
};
