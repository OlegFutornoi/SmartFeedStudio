import type { FC } from 'react';
import { useTranslation } from '@/i18n';
import { Trash2, Star, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

import type { LocalProductImageDto } from '@smartfeed/shared';
import { Button } from '@/components/ui/button';
import { ProductImageStatusBadge } from '@/components/products/ProductImageStatusBadge';

export interface ProductGalleryMainPreviewProps {
  currentImage?: LocalProductImageDto;
  resolvedMainSrc: string | null;
  productTitle: string;
  imagesCount: number;
  onPrev: () => void;
  onNext: () => void;
  onSetMain: (id: string) => void;
  onDeleteRequest: (id: string) => void;
}

export const ProductGalleryMainPreview: FC<ProductGalleryMainPreviewProps> = ({
  currentImage,
  resolvedMainSrc,
  productTitle,
  imagesCount,
  onPrev,
  onNext,
  onSetMain,
  onDeleteRequest,
}) => {
  const { t } = useTranslation(['catalogs', 'common']);

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Main Photo Display */}
      <div className="relative h-72 max-w-2xl w-full flex items-center justify-center bg-muted/20 border border-border/80 rounded-xl overflow-hidden p-2">
        {resolvedMainSrc ? (
          <img src={resolvedMainSrc} alt={productTitle} className="h-full w-full object-contain" />
        ) : (
          <AlertCircle className="h-12 w-12 text-muted-foreground/40" />
        )}

        {/* Left/Right Navigation buttons */}
        {imagesCount > 1 && (
          <>
            <button
              type="button"
              aria-label={t('common:previous')}
              title={t('common:previous')}
              onClick={onPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-card/90 border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={t('common:next')}
              title={t('common:next')}
              onClick={onNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-card/90 border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Status and Action Buttons for Selected Photo */}
      {currentImage && (
        <div className="w-full max-w-2xl mt-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs">
            <ProductImageStatusBadge image={currentImage} size="sm" showLabel />
            {currentImage.isMain && (
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-md">
                {t('catalogs:mainImageBadge')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!currentImage.isMain && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="make-main-image-btn"
                onClick={() => onSetMain(currentImage.id)}
                className="h-7 text-xs gap-1"
              >
                <Star className="h-3 w-3" />
                {t('catalogs:makeMainImage')}
              </Button>
            )}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              data-testid={`delete-image-btn-${currentImage.id}`}
              onClick={() => onDeleteRequest(currentImage.id)}
              className="h-7 text-xs gap-1"
            >
              <Trash2 className="h-3 w-3" />
              {t('catalogs:deleteImage')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
