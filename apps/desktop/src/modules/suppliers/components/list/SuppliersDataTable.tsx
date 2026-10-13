import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead } from '@/components/ui/table';
import { Truck } from 'lucide-react';
import { SupplierDto } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';
import type { SupplierColumnId } from '@/modules/suppliers/types';
import { SupplierTableRow } from '@/modules/suppliers/components/list/SupplierTableRow';

interface SuppliersDataTableProps {
  suppliers: SupplierDto[];
  onOpenDetails: (supplier: SupplierDto) => void;
  onOpenFeeds?: (supplier: SupplierDto) => void;
  onEdit: (supplier: SupplierDto) => void;
  onDelete: (supplierId: string) => void;
  onAddFeed: (supplier: SupplierDto) => void;
  onToggleStatus?: (supplier: SupplierDto) => void;
  isColumnVisible?: (id: SupplierColumnId) => boolean;
}

export const SuppliersDataTable: React.FC<SuppliersDataTableProps> = ({
  suppliers,
  onOpenDetails,
  onOpenFeeds,
  onEdit,
  onDelete,
  onAddFeed,
  onToggleStatus,
  isColumnVisible,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const visible = (id: SupplierColumnId) => (isColumnVisible ? isColumnVisible(id) : true);

  if (suppliers.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-border/80 rounded-xl bg-card/40 my-3">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Truck className="size-5" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">
            {t('suppliers:noSearchResults', { defaultValue: 'Постачальників не знайдено' })}
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm">
            {t('suppliers:noSearchDesc', {
              defaultValue: 'Спробуйте змінити фільтри або пошуковий запит',
            })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs"
      data-testid="suppliers-table"
    >
      <div className="overflow-x-auto max-h-[600px] relative">
        <Table className="w-full text-xs" data-testid="suppliers-data-table">
          {/* 100% Solid Sticky Header */}
          <TableHeader className="sticky top-0 bg-card z-10 border-b border-border/80 shadow-xs">
            <TableRow className="h-9 hover:bg-transparent">
              <TableHead className="w-[260px] pl-3.5 font-semibold text-foreground">
                {t('suppliers:columnVendor', { defaultValue: 'Постачальник' })}
              </TableHead>
              {visible('contacts') && (
                <TableHead className="w-[200px] font-semibold text-foreground">
                  {t('suppliers:columnContacts', { defaultValue: 'Контакти' })}
                </TableHead>
              )}
              {visible('feeds') && (
                <TableHead className="w-[120px] font-semibold text-foreground text-center">
                  {t('suppliers:columnFeeds', { defaultValue: 'Джерела фідів' })}
                </TableHead>
              )}
              {visible('products') && (
                <TableHead className="w-[110px] font-semibold text-foreground text-center">
                  {t('suppliers:columnProducts', { defaultValue: 'Товари' })}
                </TableHead>
              )}
              {visible('currencyMarkup') && (
                <TableHead className="w-[130px] font-semibold text-foreground text-center">
                  {t('suppliers:columnCurrencyMarkup', { defaultValue: 'Валюта / Націнка' })}
                </TableHead>
              )}
              {visible('isActiveToggle') && (
                <TableHead className="w-[80px] font-semibold text-foreground text-center">
                  {t('suppliers:columnIsActiveToggle', { defaultValue: 'Активність' })}
                </TableHead>
              )}
              {visible('status') && (
                <TableHead className="w-[110px] font-semibold text-foreground text-center">
                  {t('suppliers:columnStatus', { defaultValue: 'Статус' })}
                </TableHead>
              )}
              <TableHead className="w-[60px] pr-3.5 text-right font-semibold text-foreground">
                {t('common:actions', { defaultValue: 'Дії' })}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((s) => (
              <SupplierTableRow
                key={s.id}
                supplier={s}
                onOpenDetails={onOpenDetails}
                onOpenFeeds={onOpenFeeds}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddFeed={onAddFeed}
                onToggleStatus={onToggleStatus}
                isColumnVisible={isColumnVisible}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
