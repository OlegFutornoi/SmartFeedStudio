import React, { useState, useMemo, useCallback } from 'react';
import { ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
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

  // Track status per SKU: 'loading' | 'ready' | 'error' | 'none'
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
    <div className="space-y-2.5">
      {/* Header Bar with Live Photo Status Indicator */}
      <div className="text-xs text-muted-foreground font-medium flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span>
            {t('suppliers:sampleProductsTitle', {
              defaultValue: 'Попередній перегляд товарів (перші 5):',
            })}
          </span>

          {/* Minimalist Visual Status Badge */}
          <div data-testid="preview-photos-status-badge">
            {isLoadingPhotos ? (
              <Badge
                variant="outline"
                className="text-[11px] gap-1.5 font-normal py-0.5 px-2 text-primary border-primary/30 bg-primary/5 animate-pulse"
                title={t('suppliers:previewPhotosHint', {
                  defaultValue:
                    'Для швидкого перегляду завантажуються перші фото, решта каталогу синхронізується у фоні',
                })}
                data-testid="preview-photos-loading-badge"
              >
                <Loader2 className="size-3 animate-spin" />
                <span>
                  {t('suppliers:previewPhotosLoading', {
                    loaded: settledCount,
                    total: totalWithImages,
                    defaultValue: `Завантаження фото (${settledCount}/${totalWithImages})...`,
                  })}
                </span>
              </Badge>
            ) : isAllSettled ? (
              readyCount > 0 ? (
                <Badge
                  variant="outline"
                  className="text-[11px] gap-1.5 font-normal py-0.5 px-2 text-foreground border-border bg-secondary"
                  data-testid="preview-photos-ready-badge"
                >
                  <CheckCircle2 className="size-3 text-foreground" />
                  <span>
                    {readyCount === totalWithImages
                      ? t('suppliers:previewPhotosReady', {
                          defaultValue: 'Фото превʼю готові • решта у фоні',
                        })
                      : t('suppliers:previewPhotosPartial', {
                          ready: readyCount,
                          total: totalWithImages,
                          defaultValue: `Завантажено ${readyCount} з ${totalWithImages} фото • решта у фоні`,
                        })}
                  </span>
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-[11px] gap-1.5 font-normal py-0.5 px-2 text-muted-foreground border-border bg-muted"
                  data-testid="preview-photos-failed-badge"
                >
                  <AlertCircle className="size-3 text-muted-foreground" />
                  <span>
                    {t('suppliers:previewPhotosFailed', {
                      defaultValue: 'Фото недоступні за посиланням',
                    })}
                  </span>
                </Badge>
              )
            ) : (
              totalWithImages === 0 && (
                <Badge
                  variant="outline"
                  className="text-[11px] gap-1 font-normal py-0.5 px-2 text-muted-foreground border-border bg-muted/20"
                  data-testid="preview-photos-none-badge"
                >
                  <span>
                    {t('suppliers:previewPhotosNone', { defaultValue: 'Фото відсутні у фіді' })}
                  </span>
                </Badge>
              )
            )}
          </div>
        </div>

        <span className="text-xs text-foreground font-medium flex items-center gap-1">
          <CheckCircle2 className="size-3.5" />
          {t('suppliers:markupCalculatedLive', { defaultValue: 'Націнка врахована' })}
        </span>
      </div>

      {/* Sample Products Table (100% Solid sticky thead) */}
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-xs">
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted sticky top-0 z-20 [box-shadow:0_1px_0_hsl(var(--border))]">
              <tr className="text-foreground text-[11px] font-semibold uppercase tracking-wider">
                <th className="p-2.5 w-14 bg-muted">
                  {t('suppliers:colPhoto', { defaultValue: 'Фото' })}
                </th>
                <th className="p-2.5 w-28 bg-muted">
                  {t('suppliers:colSku', { defaultValue: 'Артикул / SKU' })}
                </th>
                <th className="p-2.5 bg-muted">
                  {t('suppliers:colTitle', { defaultValue: 'Назва товару' })}
                </th>
                <th className="p-2.5 text-right w-44 bg-muted">
                  {t('suppliers:colPrice', { defaultValue: 'Закупка → Продаж' })}
                </th>
                <th className="p-2.5 text-center w-28 bg-muted">
                  {t('suppliers:colStock', { defaultValue: 'Наявність' })}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 bg-card">
              {previewItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground text-xs">
                    {t('suppliers:noSampleProducts', {
                      defaultValue:
                        'Товари для попереднього перегляду очікують завершення аналізу фіду',
                    })}
                  </td>
                </tr>
              ) : (
                previewItems.map((prod) => (
                  <tr key={prod.sku} className="hover:bg-secondary/40 transition-colors">
                    <td className="p-2.5">
                      <PreviewProductImage
                        sku={prod.sku}
                        originalUrl={prod.images?.[0]?.originalUrl}
                        productTitle={prod.titleUk}
                        onStatusChange={handleImageStatusChange}
                        onOpenModal={handleOpenModal}
                      />
                    </td>
                    <td className="p-2.5 font-mono text-xs font-semibold text-foreground truncate">
                      {prod.sku}
                    </td>
                    <td className="p-2.5 text-foreground font-medium">
                      <div className="truncate max-w-sm" title={prod.titleUk}>
                        {prod.titleUk}
                      </div>
                    </td>
                    <td className="p-2.5 text-right whitespace-nowrap font-mono text-xs">
                      <span className="text-muted-foreground line-through text-[11px] mr-1">
                        {prod.costPrice.toLocaleString('uk-UA')} ₴
                      </span>
                      <ArrowRight className="size-3 inline text-primary mx-1" />
                      <span className="font-bold text-foreground">
                        {prod.price.toLocaleString('uk-UA')} ₴
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <Badge
                        variant={prod.inStock ? 'secondary' : 'outline'}
                        className={`text-[10px] px-2 py-0.5 font-medium ${
                          prod.inStock
                            ? 'text-foreground bg-secondary border-border'
                            : 'text-muted-foreground bg-secondary/50'
                        }`}
                      >
                        {prod.inStock ? 'В наявності' : 'Немає'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
