import { useEffect, useSyncExternalStore, useCallback } from 'react';
import { appCounterService } from '@/services/counters/counter.service';
import type { AppCountersState } from '@/services/counters/counter.service';
import { useDataSync } from '@/lib/syncEvents';

export interface UseAppCountersResult {
  counters: AppCountersState;
  isLoading: boolean;
  refresh: (force?: boolean) => Promise<AppCountersState>;
  getSupplierFeedsCount: (supplierId: string) => number;
  getSupplierProductsCount: (supplierId: string) => number;
}

export function useAppCounters(): UseAppCountersResult {
  const counters = useSyncExternalStore(
    appCounterService.subscribe,
    appCounterService.getSnapshot,
    appCounterService.getSnapshot,
  );

  useEffect(() => {
    if (counters.lastUpdated === 0) {
      appCounterService.fetchSummary();
    }
  }, [counters.lastUpdated]);

  useDataSync(['suppliers', 'feeds', 'products', 'quotas', 'all'], () => {
    appCounterService.fetchSummary(true);
  });

  const refresh = useCallback((force = true) => {
    return appCounterService.fetchSummary(force);
  }, []);

  const getSupplierFeedsCount = useCallback(
    (supplierId: string) => appCounterService.getSupplierFeedsCount(supplierId),
    [],
  );

  const getSupplierProductsCount = useCallback(
    (supplierId: string) => appCounterService.getSupplierProductsCount(supplierId),
    [],
  );

  return {
    counters,
    isLoading: counters.isLoading,
    refresh,
    getSupplierFeedsCount,
    getSupplierProductsCount,
  };
}
