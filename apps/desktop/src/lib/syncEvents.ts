import { useEffect, useRef } from 'react';

/**
 * Unified Data Synchronization Event System for Desktop Client.
 *
 * Synchronizes dependent counters, entity lists, and quotas across:
 * - Suppliers list & supplier card counters (activeFeedsCount, productsCount)
 * - Quota summary cards & limits (useQuotas)
 * - Feed sources list (SupplierFeedsModal)
 * - Catalogs / Products list
 */

export type SyncDomain =
  'all' | 'suppliers' | 'feeds' | 'products' | 'categories' | 'quotas' | 'licenses';

export interface DataSyncDetail {
  domain?: SyncDomain | SyncDomain[];
  supplierId?: string;
  feedSourceId?: string;
  force?: boolean;
}

export const SMARTFEED_DATA_SYNC_EVENT = 'smartfeed:data-sync';

/**
 * Emit a global data synchronization event to notify all listening components and contexts.
 */
export function emitDataSync(
  domain: SyncDomain | SyncDomain[] = 'all',
  detail?: Omit<DataSyncDetail, 'domain'>,
): void {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<DataSyncDetail>(SMARTFEED_DATA_SYNC_EVENT, {
      detail: {
        domain,
        ...detail,
      },
    }),
  );
}

/**
 * Hook to automatically subscribe a component or context to data sync events.
 * Executes the callback when any of the specified domains (or 'all') are emitted.
 */
export function useDataSync(
  domains: SyncDomain | SyncDomain[],
  callback: (detail: DataSyncDetail) => void | Promise<void>,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const domainsKey = Array.isArray(domains) ? domains.slice().sort().join(',') : domains;

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<DataSyncDetail>;
      const detail = customEvent.detail || {};
      const eventDomains: SyncDomain[] = Array.isArray(detail.domain)
        ? detail.domain
        : [detail.domain || 'all'];

      const listenedDomains: SyncDomain[] = Array.isArray(domains) ? domains : [domains];

      const matches =
        eventDomains.includes('all') ||
        listenedDomains.includes('all') ||
        listenedDomains.some((d) => eventDomains.includes(d));

      if (matches) {
        callbackRef.current(detail);
      }
    };

    window.addEventListener(SMARTFEED_DATA_SYNC_EVENT, handleSync);
    return () => window.removeEventListener(SMARTFEED_DATA_SYNC_EVENT, handleSync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainsKey]);
}
