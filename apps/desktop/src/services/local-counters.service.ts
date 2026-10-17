import { localDb } from '@/services/local-db';

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
      const summary = await localDb.counters.getCountersSummary();

      return {
        suppliers: summary.totalSuppliers || 0,
        products: summary.totalProducts || 0,
        feeds: summary.totalFeeds || 0,
      };
    } catch (err) {
      console.warn('LocalCountersService error:', err);
      return { suppliers: 0, products: 0, feeds: 0 };
    }
  }
}

export const localCountersService = new LocalCountersService();
