import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SupplierCategoryRuleDto, MarketplaceProfileMeta } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';

interface MarketplaceCategoryDrawerHeaderProps {
  mpMeta: MarketplaceProfileMeta;
  supplierCategory: SupplierCategoryRuleDto | null;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const MarketplaceCategoryDrawerHeader: React.FC<MarketplaceCategoryDrawerHeaderProps> = ({
  mpMeta,
  supplierCategory,
  isExpanded = true,
  onToggleExpand,
}) => {
  const { t } = useTranslation(['suppliers']);

  return (
    <SheetHeader className="sticky top-0 bg-card z-10 px-5 py-3 border-b border-border/80 text-left shrink-0 pr-12">
      <div className="flex items-center justify-between gap-2">
        <SheetTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span>
            {t('suppliers:pickerDialogTitle', {
              marketplace: mpMeta.name,
              defaultValue: `Довідник (${mpMeta.name})`,
            })}
          </span>
          <Badge variant="outline" className="font-mono text-2xs px-1.5 py-0 h-5">
            {mpMeta.xmlAttributeName}
          </Badge>
        </SheetTitle>
        {onToggleExpand && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleExpand}
            className="size-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-md shrink-0"
            title={
              isExpanded
                ? t('suppliers:collapseFullscreen', { defaultValue: 'Згорнути вікно' })
                : t('suppliers:expandFullscreen', { defaultValue: 'На весь екран' })
            }
            data-testid="marketplace-category-drawer-fullscreen-btn"
          >
            {isExpanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </Button>
        )}
      </div>
      {supplierCategory && (
        <SheetDescription className="text-xs text-muted-foreground truncate">
          {t('suppliers:pickerDialogSubtitle', {
            category: supplierCategory.name,
            defaultValue: `Для: «${supplierCategory.name}»`,
          })}
        </SheetDescription>
      )}
    </SheetHeader>
  );
};
