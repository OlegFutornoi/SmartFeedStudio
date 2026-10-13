import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/i18n';
import type { SupplierDto } from '@smartfeed/shared';

interface SupplierDrawerHeaderProps {
  supplier: SupplierDto;
  onToggleStatus: () => void;
}

export const SupplierDrawerHeader: React.FC<SupplierDrawerHeaderProps> = ({
  supplier,
  onToggleStatus,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  const initials = (supplier.name || 'V')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const formattedDate = supplier.createdAt
    ? new Date(supplier.createdAt).toLocaleDateString('uk-UA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <div
      className="p-5 pb-3 border-b border-border/80 bg-card/60 backdrop-blur-xs flex items-center justify-between gap-3 pr-10"
      data-testid="supplier-drawer-header"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="size-11 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-sm flex items-center justify-center shrink-0 shadow-xs"
          data-testid="supplier-drawer-avatar"
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2
              className="text-base font-bold tracking-tight text-foreground truncate"
              data-testid="supplier-drawer-name"
            >
              {supplier.name}
            </h2>
            {supplier.code && (
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-1.5 font-mono"
                data-testid="supplier-drawer-code"
              >
                {supplier.code}
              </Badge>
            )}
          </div>
          {formattedDate && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t('suppliers:lastSynced', { defaultValue: 'Додано' })}: {formattedDate}
            </p>
          )}
        </div>
      </div>

      {/* Status Switch */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`text-xs font-medium ${supplier.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
        >
          {supplier.isActive
            ? t('suppliers:statusActive', { defaultValue: 'Активний' })
            : t('suppliers:statusInactive', { defaultValue: 'Неактивний' })}
        </span>
        <Switch
          checked={supplier.isActive}
          onCheckedChange={onToggleStatus}
          className="cursor-pointer scale-90"
          data-testid="supplier-drawer-active-toggle"
          aria-label={t('suppliers:columnStatus', { defaultValue: 'Статус' })}
        />
      </div>
    </div>
  );
};
