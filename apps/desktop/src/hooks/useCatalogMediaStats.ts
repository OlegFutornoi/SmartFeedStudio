import { useState, useEffect, useCallback, useRef } from 'react';
import { localProductsService } from '@/services/local-db';
import { ImageSyncStatus, type LocalProductImageDto } from '@smartfeed/shared';
import { useDataSync } from '@/lib/syncEvents';

export interface CatalogMediaStats {
  totalProducts: number;
  totalImages: number;
  syncedCloudCount: number;
  localOnlyCount: number;
  remoteUrlsCount: number;
  totalSizeBytes: number;
  syncedPercentage: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useCatalogMediaStats(): CatalogMediaStats {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalImages: 0,
    syncedCloudCount: 0,
    localOnlyCount: 0,
    remoteUrlsCount: 0,
    totalSizeBytes: 0,
    syncedPercentage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const isFetchingRef = useRef(false);

  const fetchStats = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const res = await localProductsService.getProducts({ limit: 5000 });
      const products = res.items || [];

      let totalImages = 0;
      let syncedCloudCount = 0;
      let localOnlyCount = 0;
      let remoteUrlsCount = 0;
      let totalSizeBytes = 0;

      for (const prod of products) {
        const imgs = (prod.images as unknown as LocalProductImageDto[]) || [];
        totalImages += imgs.length;

        for (const img of imgs) {
          totalSizeBytes += img.fileSize || 0;

          const isCloud =
            img.syncStatus === ImageSyncStatus.SYNCED ||
            Boolean(img.cloudUrl) ||
            Boolean(img.s3Key);

          if (isCloud) {
            syncedCloudCount++;
          } else if (img.localPath || img.thumbnailPath) {
            localOnlyCount++;
          } else {
            remoteUrlsCount++;
          }
        }
      }

      const syncedPercentage =
        totalImages > 0 ? Math.round((syncedCloudCount / totalImages) * 100) : 0;

      setStats({
        totalProducts: products.length,
        totalImages,
        syncedCloudCount,
        localOnlyCount,
        remoteUrlsCount,
        totalSizeBytes,
        syncedPercentage,
      });
    } catch (err) {
      console.warn('[useCatalogMediaStats] Failed to compute stats:', err);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useDataSync(['products', 'feeds', 'storage', 'all'], () => {
    fetchStats();
  });

  return {
    ...stats,
    isLoading,
    refresh: fetchStats,
  };
}
