import React, { useState, useEffect } from 'react';
import { X, Building2, FolderTree, Barcode, DollarSign, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import type { ProductDto, LocalProductImageDto, ProductImageDto } from '@smartfeed/shared';
import { localImagesService } from '@/services/local-db';
import { ProductGalleryModal } from './ProductGalleryModal';
import { ProductDrawerImages } from './ProductDrawerImages';

interface ProductDetailsDrawerProps {
  product: ProductDto | null;
  onClose: () => void;
  onProductUpdate?: (updatedProduct: ProductDto) => void;
}

export const ProductDetailsDrawer: React.FC<ProductDetailsDrawerProps> = ({
  product,
  onClose,
  onProductUpdate,
}) => {
  const { t } = useTranslation(['catalogs', 'common']);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [localImages, setLocalImages] = useState<LocalProductImageDto[]>([]);

  useEffect(() => {
    if (product?.images) {
      setLocalImages(product.images as LocalProductImageDto[]);
      setActiveImageIdx(0);
    } else {
      setLocalImages([]);
    }
  }, [product]);

  if (!product) return null;

  const cost = product.costPrice || 0;
  const retail = product.price || 0;
  const marginDiff = retail - cost;
  const marginPercent = cost > 0 ? Math.round((marginDiff / cost) * 100) : 0;
  const currentImg = localImages[activeImageIdx] || localImages[0];

  const handleImagesUpdated = (updated: LocalProductImageDto[]) => {
    setLocalImages(updated);
    if (onProductUpdate) {
      onProductUpdate({
        ...product,
        images: updated as unknown as ProductImageDto[],
      });
    }
  };

  const handleDeleteCurrentImage = async () => {
    if (!currentImg?.id) return;
    try {
      const res = await localImagesService.deleteProductImage(currentImg.id);
      if (res.success) {
        const next = localImages.filter((img) => img.id !== currentImg.id);
        if (res.newMainImageId && next.length > 0) {
          next.forEach((img) => {
            img.isMain = img.id === res.newMainImageId;
          });
        }
        handleImagesUpdated(next);
        if (activeImageIdx >= next.length) {
          setActiveImageIdx(Math.max(0, next.length - 1));
        }
      }
    } catch (err) {
      console.warn('[ProductDetailsDrawer] Failed to delete current image:', err);
    }
  };

  return (
    <div
      data-testid="product-details-drawer"
      className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg bg-card border-l border-border h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header with solid bg */}
        <div className="p-4 border-b border-border bg-card flex items-center justify-between shrink-0">
          <div>
            <span className="text-[11px] font-mono text-muted-foreground uppercase">
              {product.sku}
            </span>
            <h3 className="text-base font-bold text-foreground line-clamp-1">{product.titleUk}</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-testid="close-drawer-btn"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Images Section */}
          <ProductDrawerImages
            images={localImages}
            activeIdx={activeImageIdx}
            productTitle={product.titleUk}
            onSelectIdx={setActiveImageIdx}
            onOpenGallery={() => setIsGalleryOpen(true)}
            onDeleteCurrent={handleDeleteCurrentImage}
          />

          {/* Pricing Grid */}
          <div className="p-3.5 bg-muted/20 border border-border/60 rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              {t('catalogs:simulatorTitle')}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-card rounded-lg border border-border/40">
                <div className="text-[10px] text-muted-foreground">{t('catalogs:productCost')}</div>
                <div className="text-xs font-bold text-foreground">
                  {cost.toLocaleString()} {product.currency}
                </div>
              </div>

              <div className="p-2 bg-card rounded-lg border border-border/40">
                <div className="text-[10px] text-muted-foreground">
                  {t('catalogs:productRetail')}
                </div>
                <div className="text-xs font-bold text-primary">
                  {retail.toLocaleString()} {product.currency}
                </div>
              </div>

              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  {t('catalogs:productMargin')}
                </div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  +{marginPercent}% (+{Math.round(marginDiff)} ₴)
                </div>
              </div>
            </div>
          </div>

          {/* Details & Specs */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {t('catalogs:productSupplier')}:
              </span>
              <span className="font-semibold text-foreground">
                {product.supplierName || product.supplierCode || '—'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <FolderTree className="h-3.5 w-3.5" />
                {t('catalogs:productCategory')}:
              </span>
              <span className="font-semibold text-foreground">{product.categoryNameUk || '—'}</span>
            </div>

            {product.barcode && (
              <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Barcode className="h-3.5 w-3.5" />
                  {t('catalogs:productBarcode')}:
                </span>
                <span className="font-mono text-foreground">{product.barcode}</span>
              </div>
            )}

            <div className="flex items-center justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                {t('catalogs:productStock')}:
              </span>
              <Badge
                variant={product.inStock ? 'secondary' : 'destructive'}
                className="text-[11px]"
              >
                {product.inStock
                  ? `${product.stockQuantity || 0} шт (${t('catalogs:statusInStock')})`
                  : t('catalogs:statusOutOfStock')}
              </Badge>
            </div>
          </div>

          {/* Attributes */}
          {product.attributes && product.attributes.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground">
                {t('catalogs:productAttributes')}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {product.attributes.map((attr, i) => (
                  <div
                    key={i}
                    className="p-2 bg-muted/20 rounded-lg border border-border/40 text-xs"
                  >
                    <div className="text-[10px] text-muted-foreground">{attr.nameUk}</div>
                    <div className="font-medium text-foreground">{attr.valueUk}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {product.descriptionUk && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-foreground">
                {t('catalogs:productDescription')}
              </h4>
              <div className="text-xs text-muted-foreground bg-muted/10 p-3 rounded-lg border border-border/40 leading-relaxed whitespace-pre-line">
                {product.descriptionUk}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-card flex items-center justify-end shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            {t('common:close')}
          </Button>
        </div>
      </div>

      {/* Full Photo Gallery & Management Modal */}
      {isGalleryOpen && (
        <ProductGalleryModal
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          productTitle={product.titleUk}
          productId={product.id}
          images={localImages}
          onImagesChange={handleImagesUpdated}
        />
      )}
    </div>
  );
};
