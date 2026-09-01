import React, { useState } from 'react';
import { Copy, Check, Eye, Trash2, Package, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import type { ProductDto } from '@smartfeed/shared';

interface ProductTableRowProps {
  product: ProductDto;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onViewDetails: (product: ProductDto) => void;
  onDeleteProduct: (product: ProductDto) => void;
}

export const ProductTableRow: React.FC<ProductTableRowProps> = ({
  product,
  isSelected,
  onToggleSelect,
  onViewDetails,
  onDeleteProduct,
}) => {
  const { t } = useTranslation(['catalogs', 'common']);
  const [copied, setCopied] = useState(false);

  const handleCopySku = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(product.sku);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate margin percent & diff
  const cost = product.costPrice || 0;
  const retail = product.price || 0;
  const marginDiff = retail - cost;
  const marginPercent = cost > 0 ? Math.round((marginDiff / cost) * 100) : 0;

  const mainImage = product.images?.find((img) => img.isMain) || product.images?.[0];

  return (
    <tr
      data-testid={`product-row-${product.id}`}
      className={`group hover:bg-muted/40 transition-colors border-b border-border/40 ${
        isSelected ? 'bg-primary/5' : ''
      }`}
    >
      {/* Selection checkbox */}
      <td className="py-3 px-3 w-10 text-center">
        <input
          type="checkbox"
          data-testid={`product-checkbox-${product.id}`}
          checked={isSelected}
          onChange={() => onToggleSelect(product.id)}
          className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
        />
      </td>

      {/* Image Thumbnail */}
      <td className="py-3 px-2 w-12">
        <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted/40 border border-border/60 flex items-center justify-center shrink-0">
          {mainImage?.cloudUrl || mainImage?.originalUrl ? (
            <img
              src={mainImage.cloudUrl || mainImage.originalUrl}
              alt={product.titleUk}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <Package className="h-5 w-5 text-muted-foreground/50" />
          )}
        </div>
      </td>

      {/* SKU & Code */}
      <td className="py-3 px-3 min-w-[120px]">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-semibold text-foreground">{product.sku}</span>
          <button
            type="button"
            data-testid={`copy-sku-btn-${product.id}`}
            onClick={handleCopySku}
            title={t('catalogs:copySkuSuccess')}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
        {product.barcode && (
          <span className="font-mono text-[10px] text-muted-foreground block">
            {product.barcode}
          </span>
        )}
      </td>

      {/* Title & Category */}
      <td className="py-3 px-3 max-w-[280px]">
        <div
          onClick={() => onViewDetails(product)}
          className="font-medium text-xs text-foreground truncate hover:text-primary cursor-pointer transition-colors"
          title={product.titleUk}
        >
          {product.titleUk}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {product.categoryNameUk ? (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-muted/20 font-normal">
              {product.categoryNameUk}
            </Badge>
          ) : null}
          {product.vendor ? (
            <span className="text-[10px] text-muted-foreground">{product.vendor}</span>
          ) : null}
        </div>
      </td>

      {/* Supplier */}
      <td className="py-3 px-3">
        <Badge
          variant="secondary"
          className="text-[11px] font-medium bg-secondary/80 text-secondary-foreground"
        >
          {product.supplierName || product.supplierCode || 'Постачальник'}
        </Badge>
      </td>

      {/* Cost & Retail Price */}
      <td className="py-3 px-3">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-foreground">
            {product.price?.toLocaleString()} {product.currency || 'UAH'}
          </div>
          {product.costPrice !== undefined && product.costPrice > 0 && (
            <div className="text-[11px] text-muted-foreground">
              {t('catalogs:colCostPrice')}: {product.costPrice.toLocaleString()}{' '}
              {product.currency || 'UAH'}
            </div>
          )}
        </div>
      </td>

      {/* Margin badge */}
      <td className="py-3 px-3">
        {marginDiff > 0 ? (
          <Badge
            variant="outline"
            className="text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
          >
            +{marginPercent}% (+{Math.round(marginDiff)} ₴)
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      {/* Stock quantity */}
      <td className="py-3 px-3">
        {product.inStock ? (
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {product.stockQuantity !== undefined
                ? `${product.stockQuantity} шт`
                : t('catalogs:statusInStock')}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
            <span className="text-xs font-medium text-red-500">
              {t('catalogs:statusOutOfStock')}
            </span>
          </div>
        )}
      </td>

      {/* Actions */}
      <td className="py-3 px-3 text-right">
        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 data-[state=open]:bg-muted"
                data-testid={`product-actions-${product.id}`}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Відкрити меню дій</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem
                onClick={() => onViewDetails(product)}
                data-testid={`view-details-btn-${product.id}`}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                {t('catalogs:viewDetails')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDeleteProduct(product)}
                data-testid={`delete-product-btn-${product.id}`}
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('catalogs:deleteProduct')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
};
