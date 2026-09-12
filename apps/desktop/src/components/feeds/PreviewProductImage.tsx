import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, ImageOff, Image as ImageIcon, ZoomIn } from 'lucide-react';
import { useTranslation } from '@/i18n';

export type PreviewImageStatus = 'loading' | 'ready' | 'error' | 'none';

interface PreviewProductImageProps {
  sku: string;
  originalUrl?: string | null;
  productTitle: string;
  onStatusChange?: (sku: string, status: PreviewImageStatus) => void;
  onOpenModal?: (url: string, title: string, sku: string) => void;
}

export const PreviewProductImage: React.FC<PreviewProductImageProps> = ({
  sku,
  originalUrl,
  productTitle,
  onStatusChange,
  onOpenModal,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  // Refs for mutable flags — avoids stale closure in useEffect / callbacks
  const hasTriedProxyRef = useRef<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Called when <img> successfully loads
  const handleLoad = useCallback(() => {
    if (!isMountedRef.current) return;
    clearTimer();
    setIsLoading(false);
    setIsError(false);
    onStatusChange?.(sku, 'ready');
  }, [clearTimer, onStatusChange, sku]);

  // Called when <img> fires onError OR when timeout expires
  const handleError = useCallback(() => {
    if (!isMountedRef.current) return;
    clearTimer();

    // First failure: try proxy to bypass CORS / hotlink protection
    if (!hasTriedProxyRef.current && originalUrl) {
      hasTriedProxyRef.current = true;
      const proxyUrl = `/feed-proxy?url=${encodeURIComponent(originalUrl)}`;
      setCurrentSrc(proxyUrl);
      setIsLoading(true);

      // Timeout for proxy attempt
      timerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        setIsLoading(false);
        setIsError(true);
        onStatusChange?.(sku, 'error');
      }, 3000);
      return;
    }

    // Both direct + proxy failed
    setIsLoading(false);
    setIsError(true);
    onStatusChange?.(sku, 'error');
  }, [clearTimer, onStatusChange, originalUrl, sku]);

  // Effect only runs when originalUrl or sku changes — no function refs in deps
  useEffect(() => {
    isMountedRef.current = true;
    clearTimer();

    if (!originalUrl) {
      setCurrentSrc(null);
      setIsLoading(false);
      setIsError(false);
      onStatusChange?.(sku, 'none');
      return;
    }

    // Reset state for new URL
    hasTriedProxyRef.current = false;
    setCurrentSrc(originalUrl);
    setIsLoading(true);
    setIsError(false);
    onStatusChange?.(sku, 'loading');

    // Timeout for direct load — if the image server is dead/slow
    timerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      handleError();
    }, 4000);

    return () => {
      isMountedRef.current = false;
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalUrl, sku]);

  if (!originalUrl) {
    return (
      <div
        className="size-9 rounded-lg bg-secondary/60 flex items-center justify-center text-muted-foreground/50 border border-border/40"
        title={t('suppliers:photoNoImage', { defaultValue: 'Немає фото у фіді' })}
        data-testid={`preview-img-empty-${sku}`}
      >
        <ImageIcon className="size-4" />
      </div>
    );
  }

  return (
    <div
      className="relative size-9 rounded-lg overflow-hidden border border-border bg-muted/40 shrink-0 group select-none"
      data-testid={`preview-img-container-${sku}`}
    >
      {/* Loading Skeleton */}
      {isLoading && (
        <div
          className="absolute inset-0 bg-muted/70 backdrop-blur-xs flex items-center justify-center text-primary z-10 animate-pulse"
          title={t('suppliers:imageLoading', { defaultValue: 'Завантаження фото...' })}
        >
          <Loader2 className="size-3.5 animate-spin" />
        </div>
      )}

      {/* Error Fallback */}
      {isError && (
        <div
          className="size-full flex items-center justify-center bg-muted/40 text-muted-foreground/60"
          title={t('suppliers:photoUnavailable', { defaultValue: 'Фото недоступне' })}
          data-testid={`preview-img-error-${sku}`}
        >
          <ImageOff className="size-4" />
        </div>
      )}

      {/* Image — always rendered so onLoad/onError fire; hidden while loading/error */}
      {currentSrc && (
        <button
          type="button"
          onClick={() => !isError && onOpenModal?.(currentSrc, productTitle, sku)}
          className="size-full p-0 border-0 bg-transparent cursor-pointer block relative focus:outline-none"
          title={
            isError
              ? t('suppliers:photoUnavailable', { defaultValue: 'Фото недоступне' })
              : t('suppliers:clickToEnlarge', { defaultValue: 'Натисніть для збільшення' })
          }
          data-testid={`preview-img-btn-${sku}`}
        >
          <img
            src={currentSrc}
            alt={productTitle}
            loading="eager"
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={`size-full object-cover transition-all duration-300 group-hover:scale-110 ${
              isLoading || isError ? 'opacity-0 absolute' : 'opacity-100 scale-100'
            }`}
          />
          {/* Hover Magnifier Overlay */}
          {!isLoading && !isError && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
              <ZoomIn className="size-3.5" />
            </div>
          )}
        </button>
      )}
    </div>
  );
};
