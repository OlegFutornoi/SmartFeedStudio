import React from 'react';
import { FolderTree, Rss, Link2, ChevronRight } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type SupplierCategoryRuleDto } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';
import { formatFeedTitle } from '@/lib/formatters';

interface SupplierCategoryRowProps {
  category: SupplierCategoryRuleDto;
  selectedMarketplace: string;
  defaultMarginPercent?: number;
  onToggleStatus: (id: string, currentActive: boolean) => void;
  onUpdateRule: (
    id: string,
    patch: {
      markupType?: 'PERCENT' | 'FIXED';
      marginPercent?: number | null;
      fixedMarkup?: number | null;
      commissionPercent?: number | null;
    },
  ) => void;
  onOpenMarketplacePicker: (category: SupplierCategoryRuleDto) => void;
}

export const SupplierCategoryRow: React.FC<SupplierCategoryRowProps> = ({
  category,
  selectedMarketplace,
  defaultMarginPercent = 0,
  onToggleStatus,
  onUpdateRule,
  onOpenMarketplacePicker,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  const cleanFeedCatId = category.feedCategoryId?.startsWith('scat_')
    ? category.feedCategoryId.split('_')[2] || category.feedCategoryId
    : category.feedCategoryId;
  const isSyntheticId = !category.name || category.name.startsWith('scat_');
  const displayName = isSyntheticId
    ? category.externalCategoryName ||
      (cleanFeedCatId && !cleanFeedCatId.startsWith('scat_')
        ? t('suppliers:categoryNumber', {
            id: cleanFeedCatId,
            defaultValue: `Категорія #${cleanFeedCatId}`,
          })
        : t('suppliers:generalCategory', { defaultValue: 'Загальна категорія' }))
    : category.name;

  const mpMap = category.marketplaceMappings?.[selectedMarketplace];

  const externalId =
    mpMap?.externalCategoryId ??
    (category.marketplaceCode === selectedMarketplace ? category.externalCategoryId : null);
  const externalName =
    mpMap?.externalCategoryName ??
    (category.marketplaceCode === selectedMarketplace ? category.externalCategoryName : null);
  const commissionVal =
    mpMap?.commissionPercent ??
    (category.marketplaceCode === selectedMarketplace ? category.commissionPercent : null) ??
    category.commissionPercent;

  const isFixed =
    category.markupType === 'FIXED' ||
    (category.markupType == null && category.fixedMarkup != null && category.marginPercent == null);

  const currentValue = isFixed ? (category.fixedMarkup ?? '') : (category.marginPercent ?? '');

  const handleSwitchToPercent = () => {
    if (!isFixed) return;
    const val =
      category.fixedMarkup !== null && category.fixedMarkup !== undefined
        ? Number(category.fixedMarkup)
        : null;
    onUpdateRule(category.id, {
      markupType: 'PERCENT',
      marginPercent: val !== null ? Math.min(500, val) : null,
      fixedMarkup: null,
    });
  };

  const handleSwitchToFixed = () => {
    if (isFixed) return;
    const val =
      category.marginPercent !== null && category.marginPercent !== undefined
        ? Number(category.marginPercent)
        : null;
    onUpdateRule(category.id, {
      markupType: 'FIXED',
      fixedMarkup: val !== null ? Math.min(100000, val) : null,
      marginPercent: null,
    });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const val = rawVal === '' ? null : Number(rawVal);
    if (isFixed) {
      onUpdateRule(category.id, {
        markupType: 'FIXED',
        fixedMarkup: val,
        marginPercent: null,
      });
    } else {
      onUpdateRule(category.id, {
        markupType: 'PERCENT',
        marginPercent: val,
        fixedMarkup: null,
      });
    }
  };

  return (
    <TableRow
      className={`h-10 border-b border-border/60 transition-colors ${
        !category.isActive ? 'opacity-60 bg-muted/20' : 'hover:bg-muted/40'
      }`}
      data-testid={`category-row-${category.id}`}
    >
      {/* 1. Switch Active / Inactive */}
      <TableCell className="pl-3 py-1.5 text-center w-[60px]">
        <Switch
          checked={category.isActive}
          onCheckedChange={() => onToggleStatus(category.id, category.isActive)}
          className="data-[state=checked]:bg-success scale-90"
          data-testid={`toggle-category-${category.id}`}
          aria-label={category.name}
        />
      </TableCell>

      {/* 2. Supplier Category Name */}
      <TableCell className="py-1.5 font-medium min-w-[170px]">
        <div className="flex items-center gap-1.5">
          <FolderTree className="size-3.5 text-muted-foreground shrink-0" />
          <span
            title={displayName}
            className={`truncate ${
              category.isActive ? 'text-foreground' : 'text-muted-foreground line-through'
            }`}
          >
            {displayName}
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

      {/* 3. Marketplace Category Mapping (XML ID + Name) */}
      <TableCell className="py-1.5 min-w-[220px]">
        <Button
          type="button"
          variant={externalId ? 'outline' : 'ghost'}
          size="sm"
          onClick={() => onOpenMarketplacePicker(category)}
          title={t('suppliers:btnChangeMarketplaceCategory', {
            defaultValue: 'Змінити відповідність категорії маркетплейсу',
          })}
          className={`h-7 px-2 text-xs w-full justify-between gap-1.5 font-normal ${
            externalId
              ? 'bg-background/90 border-border/80 text-foreground'
              : 'border border-dashed border-border/80 text-muted-foreground hover:text-foreground'
          }`}
          data-testid={`category-marketplace-btn-${category.id}`}
        >
          {externalId && externalName ? (
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <Link2 className="size-3 text-muted-foreground shrink-0" />
              <span className="truncate font-medium text-foreground">{externalName}</span>
            </div>
          ) : (
            <span className="truncate text-xs">
              {t('suppliers:btnSelectMarketplaceCategory', {
                defaultValue: 'Обрати категорію МП...',
              })}
            </span>
          )}
          <ChevronRight className="size-3 text-muted-foreground shrink-0" />
        </Button>
      </TableCell>

      {/* 4. Feed Name Attribution */}
      <TableCell className="py-1.5 w-[135px]">
        <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
          <Rss className="size-3 text-muted-foreground shrink-0" />
          <span
            className="truncate max-w-[115px] font-medium text-foreground/90 text-xs"
            title={category.feedName || undefined}
            data-testid={`category-feed-${category.id}`}
          >
            {category.feedName
              ? formatFeedTitle(category.feedName)
              : t('suppliers:primaryFeed', { defaultValue: 'Основний фід' })}
          </span>
        </div>
      </TableCell>

      {/* 5. Product Count */}
      <TableCell className="py-1.5 text-center font-mono font-medium tabular-nums w-[75px]">
        {category.productCount.toLocaleString()}
      </TableCell>

      {/* 6. Supplier Category Markup (% or ₴) */}
      <TableCell className="py-1.5 text-right w-[125px]">
        <div className="inline-flex items-center rounded-md border border-input bg-background/90 p-0.5 gap-0.5">
          <Input
            type="number"
            min="0"
            max={isFixed ? 100000 : 500}
            step={isFixed ? 1 : 0.5}
            placeholder={isFixed ? '0' : String(defaultMarginPercent)}
            aria-label={t('suppliers:markupInputAria', {
              category: displayName,
              defaultValue: `Націнка постачальника для ${displayName}`,
            })}
            value={currentValue}
            onChange={handleValueChange}
            className="w-12 h-6 text-xs text-right pr-1 font-mono tabular-nums border-0 shadow-none focus-visible:ring-0 px-1 bg-transparent"
            data-testid={`category-margin-input-${category.id}`}
          />
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant={!isFixed ? 'default' : 'ghost'}
              size="sm"
              onClick={handleSwitchToPercent}
              title={t('suppliers:markupTypePercentAria', {
                defaultValue: 'Відсоткова націнка (%)',
              })}
              aria-label={t('suppliers:markupTypePercentAria', {
                defaultValue: 'Відсоткова націнка (%)',
              })}
              className="h-6 px-1.5 text-2xs font-mono font-medium rounded-xs"
              data-testid={`category-markup-type-percent-${category.id}`}
            >
              %
            </Button>
            <Button
              type="button"
              variant={isFixed ? 'default' : 'ghost'}
              size="sm"
              onClick={handleSwitchToFixed}
              title={t('suppliers:markupTypeFixedAria', { defaultValue: 'Фіксована надбавка (₴)' })}
              aria-label={t('suppliers:markupTypeFixedAria', {
                defaultValue: 'Фіксована надбавка (₴)',
              })}
              className="h-6 px-1.5 text-2xs font-mono font-medium rounded-xs"
              data-testid={`category-markup-type-fixed-${category.id}`}
            >
              ₴
            </Button>
          </div>
        </div>
      </TableCell>

      {/* 7. Marketplace Category Commission (%) */}
      <TableCell className="pr-3 py-1.5 text-right w-[115px]">
        <div className="inline-flex items-center justify-end gap-1">
          <Input
            type="number"
            min="0"
            max="100"
            step="0.5"
            placeholder="0"
            aria-label={t('suppliers:commissionInputAria', {
              category: category.name,
              defaultValue: `Комісія маркетплейсу для ${category.name}`,
            })}
            value={commissionVal !== null && commissionVal !== undefined ? commissionVal : ''}
            onChange={(e) => {
              const val = e.target.value === '' ? null : Number(e.target.value);
              onUpdateRule(category.id, { commissionPercent: val });
            }}
            className="w-16 h-7 text-xs text-right pr-1.5 font-mono tabular-nums bg-background/90"
            data-testid={`category-commission-input-${category.id}`}
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
      </TableCell>
    </TableRow>
  );
};
