import React from 'react';
import { Truck, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';

interface SuppliersEmptyStateProps {
  isSupplierLimitReached: boolean;
  onOpenCreate: () => void;
}

export const SuppliersEmptyState: React.FC<SuppliersEmptyStateProps> = ({
  isSupplierLimitReached,
  onOpenCreate,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
    <Card
      className="border border-dashed border-border/80 bg-card/40 p-12 text-center"
      data-testid="empty-suppliers-card"
    >
      <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Truck className="size-6" />
        </div>
        <h4 className="text-base font-semibold text-foreground">
          {t('suppliers:emptyTitle', { defaultValue: 'Список постачальників порожній' })}
        </h4>
        <p className="text-xs text-muted-foreground">
          {t('suppliers:emptyDesc', {
            defaultValue: 'Додайте свого першого постачальника, щоб налаштувати фіди та націнки',
          })}
        </p>
        <Button
          onClick={onOpenCreate}
          disabled={isSupplierLimitReached}
          className="mt-2 text-xs gap-1.5"
          data-testid="empty-create-supplier-btn"
        >
          <Plus className="size-3.5" />
          {t('suppliers:createSupplier', { defaultValue: 'Додати постачальника' })}
        </Button>
      </div>
    </Card>
  );
};
