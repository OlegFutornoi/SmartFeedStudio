import React, { useState } from 'react';
import { X, Package, Building2, FolderTree, Barcode, DollarSign, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import type { ProductDto } from '@smartfeed/shared';

interface ProductDetailsDrawerProps {
  product: ProductDto | null;
  onClose: () => void;
}

export const ProductDetailsDrawer: React.FC<ProductDetailsDrawerProps> = ({ product, onClose }) => {
  const { t } = useTranslation(['catalogs', 'common']);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  if (!product) return null;

  const cost = product.costPrice || 0;
  const retail = product.price || 0;
  const marginDiff = retail - cost;
  const marginPercent = cost > 0 ? Math.round((marginDiff / cost) * 100) : 0;
  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentImg = images[activeImageIdx] || images[0];

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
          <div className="space-y-2">
            <div className="h-56 w-full rounded-xl overflow-hidden bg-muted/30 border border-border flex items-center justify-center">
              {currentImg?.cloudUrl || currentImg?.originalUrl ? (
                <img
                  src={currentImg.cloudUrl || currentImg.originalUrl}
                  alt={product.titleUk}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <Package className="h-12 w-12 text-muted-foreground/30" />
              )}
            </div>

            {/* Thumbnail selector */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`h-12 w-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                      activeImageIdx === idx ? 'border-primary' : 'border-border opacity-60'
                    }`}
                  >
                    <img
                      src={img.cloudUrl || img.originalUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

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
    </div>
  );
};
