import React, { useState } from 'react';
import { useTranslation } from '@/i18n';
import {
  X,
  Trash2,
  Star,
  HardDrive,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { LocalProductImageDto } from '@smartfeed/shared';
import { localImagesService } from '@/services/local-db';
import { resolveImageSrc } from '@/lib/image-url';
import { Button } from '@/components/ui/button';

export interface ProductGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
  productId: string;
  images: LocalProductImageDto[];
  onImagesChange?: (updatedImages: LocalProductImageDto[]) => void;
}

export const ProductGalleryModal: React.FC<ProductGalleryModalProps> = ({
  isOpen,
  onClose,
  productTitle,
  productId,
  images: initialImages,
  onImagesChange,
}) => {
  const { t } = useTranslation(['catalogs', 'common']);
  const [images, setImages] = useState<LocalProductImageDto[]>(initialImages);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentImage = images[activeIdx] || images[0];
  const resolvedMainSrc = resolveImageSrc(currentImage?.localPath, currentImage?.originalUrl);

  const handleDeleteConfirm = async () => {
    if (!imageToDelete) return;
    setIsDeleting(true);
    try {
      const res = await localImagesService.deleteProductImage(imageToDelete);
      if (res.success) {
        const nextImages = images.filter((img) => img.id !== imageToDelete);
        // If deleted was main, mark first as main
        if (res.newMainImageId && nextImages.length > 0) {
          nextImages.forEach((img) => {
            img.isMain = img.id === res.newMainImageId;
          });
        }
        setImages(nextImages);
        onImagesChange?.(nextImages);
        if (activeIdx >= nextImages.length) {
          setActiveIdx(Math.max(0, nextImages.length - 1));
        }
      }
    } catch (err) {
      console.warn('[ProductGalleryModal] Failed to delete image:', err);
    } finally {
      setIsDeleting(false);
      setImageToDelete(null);
    }
  };

  const handleSetMain = async (imgId: string) => {
    const nextImages = images.map((img) => ({
      ...img,
      isMain: img.id === imgId,
    }));
    setImages(nextImages);
    onImagesChange?.(nextImages);
    try {
      await localImagesService.updateImagesOrder({
        productId,
        imageIdsInOrder: nextImages.map((img) => img.id),
        mainImageId: imgId,
      });
    } catch (err) {
      console.warn('[ProductGalleryModal] Failed to update main image:', err);
    }
  };

  return (
    <div
      data-testid="product-gallery-modal"
      className="fixed inset-0 z-50 overflow-hidden bg-black/75 flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-4xl bg-card border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header: 100% Solid Opaque Background */}
        <div className="px-5 py-3.5 border-b border-border bg-card flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              {t('catalogs:productImages')} ({images.length})
            </span>
            <h3 className="text-base font-bold text-foreground line-clamp-1">{productTitle}</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-testid="close-gallery-modal-btn"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Modal Body: Active Image Preview & Controls */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center justify-center min-h-[320px] bg-muted/10">
          {images.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {t('catalogs:noImagesAvailable')}
            </div>
          ) : (
            <div className="relative w-full flex flex-col items-center">
              {/* Main Photo Display */}
              <div className="relative h-80 max-w-2xl w-full flex items-center justify-center bg-muted/20 border border-border/80 rounded-xl overflow-hidden p-2">
                {resolvedMainSrc ? (
                  <img
                    src={resolvedMainSrc}
                    alt={productTitle}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <AlertCircle className="h-12 w-12 text-muted-foreground/40" />
                )}

                {/* Left/Right Navigation buttons */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label={t('common:previous')}
                      title={t('common:previous')}
                      onClick={() =>
                        setActiveIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-card/90 border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={t('common:next')}
                      title={t('common:next')}
                      onClick={() =>
                        setActiveIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                      }
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
                    {currentImage.localPath ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <HardDrive className="h-3.5 w-3.5" />
                        {t('catalogs:imageStatusReady')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-500 font-medium">
                        <RefreshCw className="h-3.5 w-3.5" />
                        {t('catalogs:imageStatusPending')}
                      </span>
                    )}
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
                        onClick={() => handleSetMain(currentImage.id)}
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
                      onClick={() => setImageToDelete(currentImage.id)}
                      className="h-7 text-xs gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      {t('catalogs:deleteImage')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="w-full max-w-2xl mt-5 flex items-center gap-2.5 overflow-x-auto pb-1">
              {images.map((img, idx) => {
                const thumbSrc = resolveImageSrc(
                  img.thumbnailPath || img.localPath,
                  img.originalUrl,
                );
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    className={`relative h-14 w-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      activeIdx === idx
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border/70 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={thumbSrc || ''} alt="" className="h-full w-full object-cover" />
                    {img.isMain && (
                      <div className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete Confirmation Overlay (Solid Opaque) */}
        {imageToDelete && (
          <div className="absolute inset-0 bg-card/95 backdrop-blur-xs flex items-center justify-center p-6 z-20">
            <div className="max-w-md w-full text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-foreground">
                  {t('catalogs:deleteImageConfirmTitle')}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('catalogs:deleteImageConfirmDesc')}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setImageToDelete(null)}
                  disabled={isDeleting}
                >
                  {t('common:cancel')}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  data-testid="confirm-delete-image-btn"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                >
                  {t('catalogs:deleteImage')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
