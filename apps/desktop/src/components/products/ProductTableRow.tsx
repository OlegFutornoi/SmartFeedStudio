import React, { useState } from 'react';
import { Copy, Check, Eye, Trash2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableRow, TableCell } from '@/components/ui/table';
import { useTranslation } from '@/i18n';
import type { ProductDto, SupplierDto } from '@smartfeed/shared';
import { ProductImageThumbnail } from '@/components/products/ProductImageThumbnail';

export type ProductColumnId =
  'select' | 'image' | 'sku' | 'title' | 'supplier' | 'price' | 'margin' | 'stock' | 'actions';

interface ProductTableRowProps {
  product: ProductDto;
  suppliers?: SupplierDto[];
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onViewDetails: (product: ProductDto) => void;
  onDeleteProduct: (product: ProductDto) => void;
  visibleColumns?: Record<ProductColumnId, boolean>;
}

export const ProductTableRow: React.FC<ProductTableRowProps> = ({
  product,
  suppliers,
  isSelected,
  onToggleSelect,
  onViewDetails,
  onDeleteProduct,
  visibleColumns,
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

  // Dynamically resolve actual supplier name without falling back to literal column title
  const resolvedSupplierName = (() => {
    if (product.supplierName && product.supplierName !== 'Постачальник') {
      return product.supplierName;
    }
    const sup = suppliers?.find((s) => s.id === product.supplierId);
    if (sup?.name) return sup.name;
    if (product.supplierCode) return product.supplierCode;
    if (suppliers && suppliers.length === 1) return suppliers[0].name;
    return '—';
  })();

  return (
    <TableRow
      data-testid={`product-row-${product.id}`}
      className={`group hover:bg-muted/40 transition-colors border-b border-border/40 ${
        isSelected ? 'bg-primary/5' : ''
      }`}
    >
      {/* Selection checkbox */}
      <TableCell className="px-3 py-2 w-10 text-center">
        <input
          type="checkbox"
          data-testid={`product-checkbox-${product.id}`}
          checked={isSelected}
          onChange={() => onToggleSelect(product.id)}
          className="rounded border-input accent-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
        />
      </TableCell>

      {/* Image Thumbnail */}
      {visibleColumns?.image !== false && (
        <TableCell className="px-2 py-2 w-14 text-center">
          <ProductImageThumbnail
            image={mainImage}
            alt={product.titleUk}
            size="md"
            dataTestId={`product-thumbnail-${product.id}`}
            imageClassName="group-hover:scale-105 transition-transform duration-200"
          />
        </TableCell>
      )}

      {/* SKU & Code */}
      <TableCell className="px-3 py-2 min-w-[120px]">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-semibold text-foreground">{product.sku}</span>
          <button
            type="button"
            data-testid={`copy-sku-btn-${product.id}`}
            onClick={handleCopySku}
            title={t('catalogs:copySkuSuccess')}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
          >
            {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
        {product.barcode && (
          <span className="font-mono text-[11px] text-muted-foreground/80 block mt-0.5">
            {product.barcode}
          </span>
        )}
      </TableCell>

      {/* Title & Category */}
      <TableCell className="px-3 py-2 max-w-[280px]">
        <div
          onClick={() => onViewDetails(product)}
          className="font-medium text-xs text-foreground truncate hover:text-primary cursor-pointer transition-colors leading-relaxed"
          title={product.titleUk}
        >
          {product.titleUk}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {product.categoryNameUk ? (
            <Badge
              variant="outline"
              className="text-[10px] h-4.5 font-normal py-0 px-1.5 bg-secondary/50 text-muted-foreground border-border/50"
            >
              {product.categoryNameUk}
            </Badge>
          ) : null}
          {product.vendor ? (
            <span className="text-[11px] text-muted-foreground/80">{product.vendor}</span>
          ) : null}
        </div>
      </TableCell>

      {/* Supplier */}
      {visibleColumns?.supplier !== false && (
        <TableCell className="px-3 py-2">
          <Badge
            variant="outline"
            data-testid={`product-supplier-badge-${product.id}`}
            className="text-[10px] h-5 px-1.5 font-medium bg-secondary/40 text-foreground border-border/60 max-w-[140px] truncate"
          >
            {resolvedSupplierName}
          </Badge>
        </TableCell>
      )}

      {/* Cost & Retail Price */}
      {visibleColumns?.price !== false && (
        <TableCell className="px-3 py-2">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-foreground tabular-nums">
              {product.price?.toLocaleString()} {product.currency || 'UAH'}
            </div>
            {product.costPrice !== undefined && product.costPrice > 0 && (
              <div className="text-[11px] text-muted-foreground/80 tabular-nums">
                {t('catalogs:colCostPrice')}: {product.costPrice.toLocaleString()}{' '}
                {product.currency || 'UAH'}
              </div>
            )}
          </div>
        </TableCell>
      )}

      {/* Margin badge */}
      {visibleColumns?.margin !== false && (
        <TableCell className="px-3 py-2">
          {marginDiff > 0 ? (
            <Badge
              variant="secondary"
              className="text-[10px] h-5 px-1.5 font-medium tabular-nums bg-secondary text-secondary-foreground border border-border/50"
            >
              +{marginPercent}% (+{Math.round(marginDiff)} ₴)
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
      )}

      {/* Stock quantity */}
      {visibleColumns?.stock !== false && (
        <TableCell className="px-3 py-2">
          {product.inStock ? (
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 animate-pulse" />
              <span className="text-xs font-medium tabular-nums text-foreground">
                {product.stockQuantity !== undefined
                  ? `${product.stockQuantity} шт`
                  : t('catalogs:statusInStock')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
              <span className="text-xs font-medium text-muted-foreground">
                {t('catalogs:statusOutOfStock')}
              </span>
            </div>
          )}
        </TableCell>
      )}

      {/* Actions */}
      <TableCell className="px-3 py-2 text-right">
        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-7 w-7 p-0 data-[state=open]:bg-muted rounded-md"
                data-testid={`product-actions-${product.id}`}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
                <span className="sr-only">{t('common:actions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[155px] p-1">
              <DropdownMenuItem
                onClick={() => onViewDetails(product)}
                data-testid={`view-details-btn-${product.id}`}
                className="cursor-pointer text-xs py-1.5 px-2"
              >
                <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                {t('catalogs:viewDetails')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDeleteProduct(product)}
                data-testid={`delete-product-btn-${product.id}`}
                className="cursor-pointer text-xs py-1.5 px-2 text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                {t('catalogs:deleteProduct')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};
