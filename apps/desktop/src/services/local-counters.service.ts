import { invokeLocalDb } from '@/services/local-db/client';

export interface LocalCounts {
  suppliers: number;
  products: number;
  feeds: number;
}

class LocalCountersService {
  /**
   * Retrieves the accurate local counts for quotas from the dedicated counters table.
   * This acts as the Single Source of Truth.
   */
  async getLocalCounts(_token?: string): Promise<LocalCounts> {
    try {
      const counters = await invokeLocalDb('db_get_counters', {});

      return {
        suppliers: counters.suppliersCount || 0,
        products: counters.productsCount || 0,
        feeds: counters.feedsCount || 0,
      };
    } catch (err) {
      console.error('LocalCountersService error:', err);
      return { suppliers: 0, products: 0, feeds: 0 };
    }
  }
}

export const localCountersService = new LocalCountersService();
