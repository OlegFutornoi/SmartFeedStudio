import React from 'react';
import { TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { useTranslation } from '@/i18n';

export const SupplierCategoriesTableHeader: React.FC = () => {
  const { t } = useTranslation(['suppliers']);

  return (
    <TableHeader className="sticky top-0 bg-card z-10 border-b border-border/80">
      <TableRow className="h-9 hover:bg-transparent">
        <TableHead className="w-[60px] pl-3 font-semibold text-foreground text-center">
          {t('suppliers:columnStatus', { defaultValue: 'Статус' })}
        </TableHead>
        <TableHead className="font-semibold text-foreground min-w-[170px]">
          {t('suppliers:columnCategoryName', { defaultValue: 'Категорія товару' })}
        </TableHead>
        <TableHead className="font-semibold text-foreground min-w-[220px]">
          {t('suppliers:columnMarketplaceCategory', {
            defaultValue: 'Категорія маркетплейсу',
          })}
        </TableHead>
        <TableHead className="w-[135px] font-semibold text-foreground">
          {t('suppliers:columnFeedSource', { defaultValue: 'Назва фіду' })}
        </TableHead>
        <TableHead className="w-[75px] font-semibold text-foreground text-center">
          {t('suppliers:columnProducts', { defaultValue: 'Товари' })}
        </TableHead>
        <TableHead className="w-[125px] text-right font-semibold text-foreground">
          {t('suppliers:columnSupplierMarkup', { defaultValue: 'Націнка' })}
        </TableHead>
        <TableHead className="w-[115px] pr-3 text-right font-semibold text-foreground">
          {t('suppliers:columnMarketplaceCommission', { defaultValue: 'Комісія МП (%)' })}
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};
