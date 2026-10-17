import type { LocalCountersSummary } from '@/services/local-db/types';
import { invokeLocalDb } from '@/services/local-db/client';

export class LocalCountersService {
  async getCounters(): Promise<{
    id: string;
    suppliersCount: number;
    feedsCount: number;
    productsCount: number;
  }> {
    return invokeLocalDb('db_get_counters', {});
  }

  async getCountersSummary(): Promise<LocalCountersSummary> {
    return invokeLocalDb('db_get_counters_summary', {});
  }
}

export const localCountersService = new LocalCountersService();
