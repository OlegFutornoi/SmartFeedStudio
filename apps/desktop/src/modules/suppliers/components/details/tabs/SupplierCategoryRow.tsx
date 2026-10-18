import React from 'react';
import { FolderTree, Rss } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { SupplierCategoryRuleDto } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';

interface SupplierCategoryRowProps {
  category: SupplierCategoryRuleDto;
  defaultMarginPercent?: number;
  onToggleStatus: (id: string, currentActive: boolean) => void;
  onUpdateMarkup: (id: string, marginPercent: number | null, fixedMarkup: number | null) => void;
}

export const SupplierCategoryRow: React.FC<SupplierCategoryRowProps> = ({
  category,
  defaultMarginPercent = 0,
  onToggleStatus,
  onUpdateMarkup,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
    <TableRow
      className={`h-11 border-b border-border/60 transition-colors ${
        !category.isActive ? 'opacity-60 bg-muted/20' : 'hover:bg-muted/40'
      }`}
      data-testid={`category-row-${category.id}`}
    >
      {/* Switch Active / Inactive */}
      <TableCell className="pl-3.5 py-2 text-center w-[70px]">
        <Switch
          checked={category.isActive}
          onCheckedChange={() => onToggleStatus(category.id, category.isActive)}
          className="data-[state=checked]:bg-success scale-90"
          data-testid={`toggle-category-${category.id}`}
          aria-label={category.name}
        />
      </TableCell>

      {/* Category Name */}
      <TableCell className="py-2 font-medium">
        <div className="flex items-center gap-2">
          <FolderTree className="size-3.5 text-muted-foreground shrink-0" />
          <span
            className={category.isActive ? 'text-foreground' : 'text-muted-foreground line-through'}
          >
            {category.name}
          </span>
          {!category.isActive && (
            <Badge
              variant="outline"
              className="text-2xs h-4.5 px-1.5 text-muted-foreground border-border shrink-0"
            >
              {t('suppliers:categoryExcluded', {
                defaultValue: 'Виключено з каталогу',
              })}
            </Badge>
          )}
        </div>
      </TableCell>

      {/* Feed Source Attribution */}
      <TableCell className="py-2 w-[180px]">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Rss className="size-3 text-muted-foreground shrink-0" />
          <span
            className="truncate max-w-[150px] font-medium text-foreground/90 text-xs"
            title={category.feedName || undefined}
            data-testid={`category-feed-${category.id}`}
          >
            {category.feedName || t('suppliers:primaryFeed', { defaultValue: 'Основний фід' })}
          </span>
        </div>
      </TableCell>

      {/* Product Count */}
      <TableCell className="py-2 text-center font-mono font-medium w-[90px]">
        {category.productCount.toLocaleString()}
      </TableCell>

      {/* Custom Category Markup Input */}
      <TableCell className="pr-3.5 py-2 text-right w-[160px]">
        <div className="inline-flex items-center justify-end gap-1.5">
          <Input
            type="number"
            min="0"
            max="200"
            placeholder={String(defaultMarginPercent)}
            value={
              category.marginPercent !== null && category.marginPercent !== undefined
                ? category.marginPercent
                : ''
            }
            onChange={(e) => {
              const val = e.target.value === '' ? null : Number(e.target.value);
              onUpdateMarkup(category.id, val, category.fixedMarkup ?? null);
            }}
            className="w-20 h-7 text-xs text-right pr-2 font-mono bg-background/80"
            data-testid={`category-margin-input-${category.id}`}
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
      </TableCell>
    </TableRow>
  );
};
