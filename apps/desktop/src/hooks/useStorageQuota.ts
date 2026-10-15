import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { StorageQuotaDto } from '@smartfeed/shared';
import { useAuth } from '@/contexts/AuthContext';
import { getStorageQuota, invalidateStorageQuotaCache } from '@/services/storage';
import { useDataSync } from '@/lib/syncEvents';

export function formatStorageBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export interface StorageQuotaState {
  quota: StorageQuotaDto | null;
  isLoading: boolean;
  error: string | null;
  isLocked: boolean;
  isOverQuota: boolean;
  percentUsed: number;
  usedFormatted: string;
  maxFormatted: string;
  availableFormatted: string;
  refetch: () => Promise<void>;
}

export function useStorageQuota(): StorageQuotaState {
  const { token, isAuthenticated } = useAuth();
  const [quota, setQuota] = useState<StorageQuotaDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const lastFetchedTokenRef = useRef<string | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  const fetchQuota = useCallback(
    async (force = false) => {
      if (!token || !isAuthenticated) {
        setQuota(null);
        return;
      }
      if (force) {
        lastFetchedTokenRef.current = null;
        invalidateStorageQuotaCache();
      }
      if (!force && lastFetchedTokenRef.current === token) return;
      if (isFetchingRef.current) return;

      try {
        isFetchingRef.current = true;
        setIsLoading(true);
        setError(null);
        const data = await getStorageQuota(token, force);
        lastFetchedTokenRef.current = token;
        setQuota(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch storage quota';
        setError(message);
        console.warn('[useStorageQuota] Fetch failed:', message);
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
      }
    },
    [token, isAuthenticated],
  );

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  // Synchronize strictly when storage or quota metrics change (FE-13)
  useDataSync(['storage', 'quotas'], () => {
    fetchQuota(true);
  });

  const refetch = useCallback(async () => {
    await fetchQuota(true);
  }, [fetchQuota]);

  const isLocked = useMemo(() => {
    if (!quota) return false;
    return !quota.canCloudStorage || quota.maxStorageGb === 0;
  }, [quota]);

  const percentUsed = useMemo(() => {
    if (!quota || isLocked) return 0;
    return Math.min(Math.round(quota.usedPercentage), 100);
  }, [quota, isLocked]);

  const isOverQuota = useMemo(() => {
    if (!quota || isLocked) return false;
    return quota.usedPercentage >= 100 || quota.availableBytes <= 0;
  }, [quota, isLocked]);

  const usedFormatted = useMemo(() => {
    return quota ? formatStorageBytes(quota.usedStorageBytes) : '0 B';
  }, [quota]);

  const maxFormatted = useMemo(() => {
    if (!quota) return '0 GB';
    return `${quota.maxStorageGb} GB`;
  }, [quota]);

  const availableFormatted = useMemo(() => {
    return quota ? formatStorageBytes(Math.max(quota.availableBytes, 0)) : '0 B';
  }, [quota]);

  return {
    quota,
    isLoading,
    error,
    isLocked,
    isOverQuota,
    percentUsed,
    usedFormatted,
    maxFormatted,
    availableFormatted,
    refetch,
  };
}
