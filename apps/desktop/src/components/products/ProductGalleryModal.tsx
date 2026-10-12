import { useState, type FC } from 'react';
import { useTranslation } from '@/i18n';
import { X, Plus, Image as ImageIcon } from 'lucide-react';
import {
  ImageDownloadStatus,
  ImageSyncStatus,
  type LocalProductImageDto,
  type StorageFileDto,
} from '@smartfeed/shared';
import { localImagesService } from '@/services/local-db';
import { resolveImageSrc } from '@/lib/image-url';
import { Button } from '@/components/ui/button';
import { StorageQuotaBar } from '@/components/storage/StorageQuotaBar';
import { DirectPhotoUploader } from '@/components/storage/DirectPhotoUploader';
import { ProductGalleryDeleteConfirm } from '@/components/products/ProductGalleryDeleteConfirm';
import { ProductGalleryMainPreview } from '@/components/products/ProductGalleryMainPreview';

export interface ProductGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
  productId: string;
  images: LocalProductImageDto[];
  onImagesChange?: (updatedImages: LocalProductImageDto[]) => void;
}

export const ProductGalleryModal: FC<ProductGalleryModalProps> = ({
  isOpen,
  onClose,
  productTitle,
  productId,
  images: initialImages,
  onImagesChange,
}) => {
  const { t } = useTranslation(['catalogs', 'storage', 'common']);
  const [images, setImages] = useState<LocalProductImageDto[]>(initialImages);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);

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

  const handlePhotoUploaded = (file: StorageFileDto) => {
    const newImage: LocalProductImageDto = {
      id: file.id,
      productId,
      originalUrl: file.publicUrl,
      localPath: undefined,
      thumbnailPath: undefined,
      fileSize: file.sizeBytes,
      order: images.length,
      isMain: images.length === 0,
      status: ImageDownloadStatus.READY,
      retryCount: 0,
      s3Key: file.s3Key,
      cloudUrl: file.publicUrl,
      syncStatus: ImageSyncStatus.SYNCED,
    };
    const updated = [...images, newImage];
    setImages(updated);
    onImagesChange?.(updated);
    setActiveIdx(updated.length - 1);
    setShowUploader(false);
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
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={showUploader ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowUploader((prev) => !prev)}
              data-testid="toggle-upload-photo-btn"
              className="h-8 text-xs gap-1.5 font-medium"
            >
              {showUploader ? (
                <>
                  <ImageIcon className="size-3.5" />
                  <span>{t('catalogs:productImages')}</span>
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  <span>{t('storage:addPhoto')}</span>
                </>
              )}
            </Button>
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
        </div>

        {/* Modal Body: Direct Photo Uploader OR Gallery Preview */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center justify-center min-h-[340px] bg-muted/10">
          {showUploader ? (
            <div className="w-full max-w-xl py-4 space-y-4">
              <DirectPhotoUploader productId={productId} onSuccess={handlePhotoUploaded} />
            </div>
          ) : images.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-3">
              <p>{t('catalogs:noImagesAvailable')}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowUploader(true)}
                className="gap-1.5 text-xs"
              >
                <Plus className="size-3.5" />
                <span>{t('storage:addPhoto')}</span>
              </Button>
            </div>
          ) : (
            <ProductGalleryMainPreview
              currentImage={currentImage}
              resolvedMainSrc={resolvedMainSrc}
              productTitle={productTitle}
              imagesCount={images.length}
              onPrev={() => setActiveIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
              onNext={() => setActiveIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
              onSetMain={handleSetMain}
              onDeleteRequest={setImageToDelete}
            />
          )}

          {/* Thumbnail Strip */}
          {!showUploader && images.length > 1 && (
            <div className="w-full max-w-2xl mt-4 flex items-center gap-2.5 overflow-x-auto pb-1">
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

        {/* Modal Footer: Compact Storage Quota Bar */}
        <div className="px-5 py-2.5 bg-card border-t border-border flex items-center justify-between shrink-0">
          <StorageQuotaBar variant="compact" />
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs h-7">
            {t('common:close')}
          </Button>
        </div>

        {/* Delete Confirmation Overlay */}
        <ProductGalleryDeleteConfirm
          isOpen={!!imageToDelete}
          isDeleting={isDeleting}
          onCancel={() => setImageToDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </div>
  );
};
