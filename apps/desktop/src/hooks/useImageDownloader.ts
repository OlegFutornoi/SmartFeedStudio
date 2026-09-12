import { useState, useRef, useCallback } from 'react';
import type { LocalProductImageDto, ProductDto, ImageDownloadProgressDto } from '@smartfeed/shared';
import { localImagesService } from '@/services/local-db';

export function useImageDownloader() {
  const [progress, setProgress] = useState<ImageDownloadProgressDto>({
    total: 0,
    completed: 0,
    failed: 0,
    bytesDownloaded: 0,
    isFinished: true,
  });
  const [isDownloading, setIsDownloading] = useState(false);

  // Concurrency and in-flight tracking
  const inFlightRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<Array<{ id: string; url: string }>>([]);

  const downloadImage = useCallback(
    async (imageId: string, imageUrl: string): Promise<LocalProductImageDto | null> => {
      if (inFlightRef.current.has(imageId)) return null;

      try {
        inFlightRef.current.add(imageId);
        const res = await localImagesService.downloadProductImage(imageId, imageUrl);
        return res;
      } catch (err) {
        console.warn(`[useImageDownloader] Download failed for image ${imageId}:`, err);
        return null;
      } finally {
        inFlightRef.current.delete(imageId);
      }
    },
    [],
  );

  const downloadBatch = useCallback(
    async (items: Array<{ id: string; url: string }>, concurrency = 4) => {
      if (items.length === 0) return;

      setIsDownloading(true);
      setProgress({
        total: items.length,
        completed: 0,
        failed: 0,
        bytesDownloaded: 0,
        isFinished: false,
      });

      queueRef.current = [...items];
      let completedCount = 0;
      let failedCount = 0;

      const worker = async () => {
        while (queueRef.current.length > 0) {
          const item = queueRef.current.shift();
          if (!item) break;

          try {
            const res = await downloadImage(item.id, item.url);
            if (res && res.status === 'READY') {
              completedCount++;
            } else {
              failedCount++;
            }
          } catch {
            failedCount++;
          }

          setProgress((prev) => ({
            ...prev,
            completed: completedCount,
            failed: failedCount,
            currentUrl: item.url,
          }));
        }
      };

      const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
      await Promise.all(workers);

      setIsDownloading(false);
      setProgress((prev) => ({
        ...prev,
        isFinished: true,
      }));
    },
    [downloadImage],
  );

  const downloadProductImages = useCallback(
    async (product: ProductDto) => {
      const pending = ((product.images as LocalProductImageDto[]) || [])
        .filter((img) => img.status !== 'READY')
        .map((img) => ({ id: img.id, url: img.originalUrl }));

      await downloadBatch(pending);
    },
    [downloadBatch],
  );

  return {
    progress,
    isDownloading,
    downloadImage,
    downloadBatch,
    downloadProductImages,
  };
}
