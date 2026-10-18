import React, { useState, useMemo, useCallback } from 'react';
import { ArrowRight, CheckCircle2, Loader2, AlertCircle, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import type { FeedAnalysisResult } from '@/lib/api';
import {
  PreviewProductImage,
  type PreviewImageStatus,
} from '@/components/feeds/PreviewProductImage';
import { PreviewImageModal } from '@/components/feeds/PreviewImageModal';

interface WizardSampleProductsTableProps {
  sampleProducts: FeedAnalysisResult['sampleProducts'];
}

interface ModalState {
  isOpen: boolean;
  imageUrl: string | null;
  productTitle: string;
  sku: string;
}

export const WizardSampleProductsTable: React.FC<WizardSampleProductsTableProps> = ({
  sampleProducts,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    imageUrl: null,
    productTitle: '',
    sku: '',
  });

  const [skuStatusMap, setSkuStatusMap] = useState<Record<string, PreviewImageStatus>>({});
  const previewItems = useMemo(() => (sampleProducts || []).slice(0, 5), [sampleProducts]);

  const totalWithImages = useMemo(() => {
    return previewItems.filter((p) => p.images && p.images.length > 0 && p.images[0]?.originalUrl)
      .length;
  }, [previewItems]);

  const readyCount = useMemo(() => {
    return previewItems.filter((p) => skuStatusMap[p.sku] === 'ready').length;
  }, [previewItems, skuStatusMap]);

  const errorCount = useMemo(() => {
    return previewItems.filter((p) => skuStatusMap[p.sku] === 'error').length;
  }, [previewItems, skuStatusMap]);

  const settledCount = readyCount + errorCount;
  const isAllSettled = totalWithImages > 0 && settledCount >= totalWithImages;
  const isLoadingPhotos = totalWithImages > 0 && !isAllSettled;

  const handleImageStatusChange = useCallback((sku: string, status: PreviewImageStatus) => {
    setSkuStatusMap((prev) => {
      if (prev[sku] === status) return prev;
      return { ...prev, [sku]: status };
    });
  }, []);

  const handleOpenModal = (imageUrl: string, productTitle: string, sku: string) => {
    setModalState({
      isOpen: true,
      imageUrl,
      productTitle,
      sku,
    });
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
      {/* Header Bar with Live Photo Status Indicator */}
      <div className="px-3.5 py-2 border-b border-border/60 bg-muted/20 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <ShoppingBag className="size-3.5 text-muted-foreground" />
          <span className="font-semibold text-foreground">
            {t('suppliers:sampleProductsTitle', {
              defaultValue: 'Попередній перегляд товарів (перші 5):',
            })}
          </span>

          {/* Minimalist Visual Status Badge */}
          <div data-testid="preview-photos-status-badge">
            {isLoadingPhotos ? (
              <Badge
                variant="outline"
                className="text-3xs gap-1 font-normal py-0 px-1.5 text-foreground border-border bg-background animate-pulse"
                data-testid="preview-photos-loading-badge"
              >
                <Loader2 className="size-2.5 animate-spin text-muted-foreground" />
                <span>
                  {t('suppliers:previewPhotosLoading', {
                    loaded: settledCount,
                    total: totalWithImages,
                    defaultValue: `Фото (${settledCount}/${totalWithImages})…`,
                  })}
                </span>
              </Badge>
            ) : isAllSettled ? (
              readyCount > 0 ? (
                <Badge
                  variant="outline"
                  className="text-3xs gap-1 font-normal py-0 px-1.5 text-foreground border-border bg-background"
                  data-testid="preview-photos-ready-badge"
                >
                  <CheckCircle2 className="size-2.5 text-success" />
                  <span>
                    {t('suppliers:previewPhotosReady', {
                      defaultValue: 'Фото перевірені',
                    })}
                  </span>
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-3xs gap-1 font-normal py-0 px-1.5 text-muted-foreground border-border bg-muted"
                  data-testid="preview-photos-failed-badge"
                >
                  <AlertCircle className="size-2.5 text-muted-foreground" />
                  <span>
                    {t('suppliers:previewPhotosFailed', {
                      defaultValue: 'Фото недоступні',
                    })}
                  </span>
                </Badge>
              )
            ) : null}
          </div>
        </div>

        <span className="text-3xs text-muted-foreground font-medium flex items-center gap-1 font-mono">
          <CheckCircle2 className="size-3 text-success" />
          {t('suppliers:markupCalculatedLive', { defaultValue: 'Націнка врахована' })}
        </span>
      </div>

      {/* Modern Compact Product Cards Grid (Zero Nested Scrollbars) */}
      <div className="p-2.5">
        {previewItems.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground text-xs">
            {t('suppliers:noSampleProducts', {
              defaultValue: 'Товари для попереднього перегляду очікують завершення аналізу фіду',
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {previewItems.map((prod) => (
              <div
                key={prod.sku}
                className="p-2.5 rounded-md border border-border/60 bg-background/60 hover:bg-muted/20 transition-colors flex flex-col justify-between gap-1.5 min-w-0"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <div className="shrink-0 size-10 rounded-md overflow-hidden bg-background border border-border/60 flex items-center justify-center p-0.5">
                    <PreviewProductImage
                      sku={prod.sku}
                      originalUrl={prod.images?.[0]?.originalUrl}
                      productTitle={prod.titleUk}
                      onStatusChange={handleImageStatusChange}
                      onOpenModal={handleOpenModal}
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-3xs font-medium text-muted-foreground truncate">
                        {prod.sku}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-3xs px-1 py-0 h-4 shrink-0 ${
                          prod.inStock
                            ? 'border-success/30 bg-success/10 text-success'
                            : 'border-border bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        {prod.inStock
                          ? t('suppliers:inStock', { defaultValue: 'В наявності' })
                          : t('suppliers:outOfStock', { defaultValue: 'Немає' })}
                      </Badge>
                    </div>

                    <p
                      className="text-2xs font-medium text-foreground line-clamp-2 leading-tight"
                      title={prod.titleUk}
                    >
                      {prod.titleUk}
                    </p>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-border/40 text-3xs font-mono tabular-nums flex items-center justify-between gap-1">
                  <span className="text-muted-foreground line-through">
                    {prod.costPrice.toLocaleString('uk-UA')} ₴
                  </span>
                  <div className="flex items-center gap-1">
                    <ArrowRight className="size-2.5 text-muted-foreground" />
                    <span className="font-bold text-foreground">
                      {prod.price.toLocaleString('uk-UA')} ₴
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enlarged Photo Modal */}
      <PreviewImageModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        imageUrl={modalState.imageUrl}
        productTitle={modalState.productTitle}
        sku={modalState.sku}
      />
    </div>
  );
};
