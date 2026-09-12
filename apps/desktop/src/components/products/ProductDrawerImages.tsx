import React from 'react';
import { Images, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';
import type { LocalProductImageDto } from '@smartfeed/shared';
import { ProductImageThumbnail } from './ProductImageThumbnail';

interface ProductDrawerImagesProps {
  images: LocalProductImageDto[];
  activeIdx: number;
  productTitle: string;
  onSelectIdx: (idx: number) => void;
  onOpenGallery: () => void;
  onDeleteCurrent: () => void;
}

export const ProductDrawerImages: React.FC<ProductDrawerImagesProps> = ({
  images,
  activeIdx,
  productTitle,
  onSelectIdx,
  onOpenGallery,
  onDeleteCurrent,
}) => {
  const { t } = useTranslation(['catalogs', 'common']);
  const currentImg = images[activeIdx] || images[0];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Images className="h-3.5 w-3.5 text-primary" />
          {t('catalogs:productImages')} ({images.length})
        </span>
        {images.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="open-gallery-modal-btn"
              onClick={onOpenGallery}
              className="h-6 text-[11px] px-2 text-primary hover:text-primary"
            >
              {t('catalogs:viewFullGallery')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="drawer-delete-image-btn"
              onClick={onDeleteCurrent}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              title={t('catalogs:deleteImage')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <div className="h-56 w-full rounded-xl overflow-hidden bg-muted/30 border border-border flex items-center justify-center p-2">
        <ProductImageThumbnail
          image={currentImg}
          alt={productTitle}
          size="xl"
          className="h-full w-full border-0 bg-transparent"
          imageClassName="object-contain"
        />
      </div>

      {images.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              data-testid={`drawer-thumbnail-${idx}`}
              onClick={() => onSelectIdx(idx)}
              className={`h-12 w-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                activeIdx === idx ? 'border-primary' : 'border-border opacity-60'
              }`}
            >
              <ProductImageThumbnail
                image={img}
                alt=""
                size="sm"
                className="h-full w-full border-0"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
