import React from 'react';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import type { SupplierCategoryRuleDto, MarketplaceProfileMeta } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';

interface MarketplaceCategoryDrawerHeaderProps {
  mpMeta: MarketplaceProfileMeta;
  supplierCategory: SupplierCategoryRuleDto | null;
}

export const MarketplaceCategoryDrawerHeader: React.FC<MarketplaceCategoryDrawerHeaderProps> = ({
  mpMeta,
  supplierCategory,
}) => {
  const { t } = useTranslation(['suppliers']);

  return (
    <SheetHeader className="sticky top-0 bg-card z-10 px-5 py-3 border-b border-border/80 text-left shrink-0">
      <div className="flex items-center justify-between">
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
