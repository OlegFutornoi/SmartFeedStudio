import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserQuotas } from '@/lib/api';
import type { UserQuotasDto, QuotaItemDto } from '@smartfeed/shared';
import { useDataSync } from '@/lib/syncEvents';
import { localCountersService } from '@/services/local-counters.service';

interface QuotasContextType {
  quotas: UserQuotasDto | null;
  isLoading: boolean;
  refreshQuotas: (force?: boolean) => Promise<void>;
  updateLocalQuota: (
    type: 'suppliers' | 'products' | 'feeds' | 'channels' | 'teamSeats' | 'aiCredits',
    delta: number,
  ) => void;
  setLocalQuotaUsed: (
    type: 'suppliers' | 'products' | 'feeds' | 'channels' | 'teamSeats' | 'aiCredits',
    count: number,
  ) => void;
  isSupplierLimitReached: boolean;
  isProductLimitReached: boolean;
  isFeedLimitReached: boolean;
  isAnyLimitExceeded: boolean;
}

const QuotasContext = createContext<QuotasContextType | undefined>(undefined);

export function QuotasProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [quotas, setQuotas] = useState<UserQuotasDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isFetchingRef = useRef<boolean>(false);
  const lastFetchedTokenRef = useRef<string | null>(null);

  const fetchQuotas = useCallback(
    async (force = false) => {
      if (!token || !isAuthenticated) {
        setQuotas(null);
        setIsLoading(false);
        lastFetchedTokenRef.current = null;
        return;
      }

      if (force) {
        lastFetchedTokenRef.current = null;
      } else if (lastFetchedTokenRef.current === token) {
        return;
      }

      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const data = await getUserQuotas(token);
        if (data) {
          const localCounts = await localCountersService.getLocalCounts(token);

          const applyLocalCount = (item: QuotaItemDto, count: number) => {
            item.used = count;
            item.percentUsed = item.isUnlimited
              ? 0
              : item.max > 0
                ? Math.min(100, Math.round((count / item.max) * 100))
                : 0;
            item.isExceeded = !item.isUnlimited && count >= item.max;
            item.remaining = item.isUnlimited ? 999999 : Math.max(0, item.max - count);
          };

          if (data.suppliers) applyLocalCount(data.suppliers, localCounts.suppliers);
          if (data.products) applyLocalCount(data.products, localCounts.products);
          if (data.feeds) applyLocalCount(data.feeds, localCounts.feeds);

          setQuotas(data);
          lastFetchedTokenRef.current = token;
        }
      } catch (err) {
        console.error('Failed to fetch user quotas:', err);
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
      }
    },
    [token, isAuthenticated],
  );

  const updateLocalQuota = useCallback(
    (
      type: 'suppliers' | 'products' | 'feeds' | 'channels' | 'teamSeats' | 'aiCredits',
      delta: number,
    ) => {
      setQuotas((prev) => {
        if (!prev || !prev[type]) return prev;
        const currentItem = prev[type] as QuotaItemDto;
        const newUsed = Math.max(0, currentItem.used + delta);
        const isUnlimited = currentItem.isUnlimited;
        const percentUsed = isUnlimited
          ? 0
          : currentItem.max > 0
            ? Math.min(100, Math.round((newUsed / currentItem.max) * 100))
            : 0;
        const isExceeded = !isUnlimited && newUsed >= currentItem.max;
        const remaining = isUnlimited ? 999999 : Math.max(0, currentItem.max - newUsed);

        return {
          ...prev,
          [type]: {
            ...currentItem,
            used: newUsed,
            percentUsed,
            isExceeded,
            remaining,
          },
        };
      });
    },
    [],
  );

  const setLocalQuotaUsed = useCallback(
    (
      type: 'suppliers' | 'products' | 'feeds' | 'channels' | 'teamSeats' | 'aiCredits',
      count: number,
    ) => {
      setQuotas((prev) => {
        if (!prev || !prev[type]) return prev;
        const currentItem = prev[type] as QuotaItemDto;
        const newUsed = Math.max(0, count);
        const isUnlimited = currentItem.isUnlimited;
        const percentUsed = isUnlimited
          ? 0
          : currentItem.max > 0
            ? Math.min(100, Math.round((newUsed / currentItem.max) * 100))
            : 0;
        const isExceeded = !isUnlimited && newUsed >= currentItem.max;
        const remaining = isUnlimited ? 999999 : Math.max(0, currentItem.max - newUsed);

        return {
          ...prev,
          [type]: {
            ...currentItem,
            used: newUsed,
            percentUsed,
            isExceeded,
            remaining,
          },
        };
      });
    },
    [],
  );

  const syncLocalCounts = useCallback(async () => {
    try {
      const localCounts = await localCountersService.getLocalCounts(token || undefined);

      setLocalQuotaUsed('suppliers', localCounts.suppliers);
      setLocalQuotaUsed('products', localCounts.products);
      setLocalQuotaUsed('feeds', localCounts.feeds);
    } catch (err) {
      console.error('Failed to sync local quota counts:', err);
    }
  }, [setLocalQuotaUsed, token]);

  useEffect(() => {
    fetchQuotas();
  }, [fetchQuotas]);

  // Unified reactive data sync subscription
  useDataSync(['quotas', 'all'], () => {
    fetchQuotas(true);
  });

  // Local data changes tracker to update quotas immediately
  useDataSync(['suppliers', 'products', 'feeds'], () => {
    syncLocalCounts();
  });

  // Global legacy event listener for instant local delta sync
  useEffect(() => {
    const handleQuotaSync = (e: Event) => {
      const customEvent = e as CustomEvent<{
        type?: 'suppliers' | 'products' | 'feeds';
        delta?: number;
        force?: boolean;
      }>;
      if (customEvent.detail?.type && customEvent.detail?.delta !== undefined) {
        updateLocalQuota(customEvent.detail.type, customEvent.detail.delta);
        // Also trigger full local sync just in case
        syncLocalCounts();
      } else {
        fetchQuotas(true);
      }
    };

    window.addEventListener('smartfeed:quota-update', handleQuotaSync);
    return () => window.removeEventListener('smartfeed:quota-update', handleQuotaSync);
  }, [fetchQuotas, updateLocalQuota, syncLocalCounts]);

  const isSupplierLimitReached = Boolean(
    quotas?.suppliers &&
    !quotas.suppliers.isUnlimited &&
    quotas.suppliers.used >= quotas.suppliers.max,
  );

  const isProductLimitReached = Boolean(
    quotas?.products && !quotas.products.isUnlimited && quotas.products.used >= quotas.products.max,
  );

  const isFeedLimitReached = Boolean(
    quotas?.feeds && !quotas.feeds.isUnlimited && quotas.feeds.used >= quotas.feeds.max,
  );

  const isAnyLimitExceeded = Boolean(
    (quotas?.suppliers &&
      !quotas.suppliers.isUnlimited &&
      quotas.suppliers.used > quotas.suppliers.max) ||
    (quotas?.products &&
      !quotas.products.isUnlimited &&
      quotas.products.used > quotas.products.max) ||
    (quotas?.feeds && !quotas.feeds.isUnlimited && quotas.feeds.used > quotas.feeds.max),
  );

  const value = useMemo(
    () => ({
      quotas,
      isLoading,
      refreshQuotas: () => fetchQuotas(true),
      updateLocalQuota,
      setLocalQuotaUsed,
      isSupplierLimitReached,
      isProductLimitReached,
      isFeedLimitReached,
      isAnyLimitExceeded,
    }),
    [
      quotas,
      isLoading,
      fetchQuotas,
      updateLocalQuota,
      setLocalQuotaUsed,
      isSupplierLimitReached,
      isProductLimitReached,
      isFeedLimitReached,
      isAnyLimitExceeded,
    ],
  );

  return <QuotasContext.Provider value={value}>{children}</QuotasContext.Provider>;
}

export function useQuotas(): QuotasContextType {
  const context = useContext(QuotasContext);
  if (!context) {
    throw new Error('useQuotas must be used within a QuotasProvider');
  }
  return context;
}
