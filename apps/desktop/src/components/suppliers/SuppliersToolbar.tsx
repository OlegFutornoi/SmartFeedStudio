import React from 'react';
import { Search, Plus, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/i18n';

interface SuppliersToolbarProps {
  search: string;
  isSupplierLimitReached: boolean;
  isFeedLimitReached: boolean;
  onSearchChange: (val: string) => void;
  onOpenCreate: () => void;
  onOpenImportWizard: () => void;
}

export const SuppliersToolbar: React.FC<SuppliersToolbarProps> = ({
  search,
  isSupplierLimitReached,
  isFeedLimitReached,
  onSearchChange,
  onOpenCreate,
  onOpenImportWizard,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  const feedTooltip = isFeedLimitReached
    ? t('suppliers:feedLimitReachedTooltip', {
        defaultValue: 'Ліміт джерел фідів вичерпано. Підвищіть тариф або видаліть зайві фіди.',
      })
    : undefined;

  const supplierTooltip = isSupplierLimitReached
    ? t('suppliers:supplierLimitReachedTooltip', {
        defaultValue:
          'Ліміт постачальників вичерпано. Підвищіть тариф або видаліть зайвих постачальників.',
      })
    : undefined;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('suppliers:searchPlaceholder', {
            defaultValue: 'Пошук постачальника за назвою або кодом...',
          })}
          className="pl-9 h-9 text-xs"
        />
      </div>

      <div className="flex items-center gap-2">
        <div title={feedTooltip}>
          <Button
            variant="outline"
            onClick={onOpenImportWizard}
            disabled={isFeedLimitReached}
            title={feedTooltip}
            className="h-9 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="import-feed-header-btn"
          >
            <Radio className="h-4 w-4" />
            {t('suppliers:importFeed', { defaultValue: 'Підключити фід' })}
          </Button>
        </div>

        <div title={supplierTooltip}>
          <Button
            onClick={onOpenCreate}
            disabled={isSupplierLimitReached}
            title={supplierTooltip}
            className="h-9 text-xs gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="add-supplier-header-btn"
          >
            <Plus className="h-4 w-4" />
            {t('suppliers:createSupplier', { defaultValue: 'Додати постачальника' })}
          </Button>
        </div>
      </div>
    </div>
  );
};
