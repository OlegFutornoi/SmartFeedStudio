// @golden - Reference pattern for 100% solid non-translucent sticky drawer header (UI-01, UI-05)
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ExternalLink } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { SupplierDto } from '@smartfeed/shared';
import { SupplierAvatar } from '@/modules/suppliers/components/common/SupplierAvatar';

interface SupplierDrawerHeaderProps {
  supplier: SupplierDto;
  onToggleStatus: () => void;
}

export const SupplierDrawerHeader: React.FC<SupplierDrawerHeaderProps> = ({
  supplier,
  onToggleStatus,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  const formattedDate = supplier.createdAt
    ? new Date(supplier.createdAt).toLocaleDateString('uk-UA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <div
      className="p-4 px-5 border-b border-border/80 bg-card pr-10"
      data-testid="supplier-drawer-header"
    >
      {/* Top Vendor Info & Status */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <SupplierAvatar
            logoUrl={supplier.logoUrl}
            name={supplier.name}
            size="lg"
            dataTestId="supplier-drawer-avatar"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2
                className="text-base font-bold tracking-tight text-foreground truncate"
                data-testid="supplier-drawer-name"
              >
                {supplier.name}
              </h2>
              {supplier.code && (
                <Badge
                  variant="outline"
                  className="text-2xs py-0 px-1.5 font-mono"
                  data-testid="supplier-drawer-code"
                >
                  {supplier.code}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
              {supplier.contactEmail && <span>{supplier.contactEmail}</span>}
              {supplier.contactEmail && supplier.website && <span>•</span>}
              {supplier.website && (
                <a
                  href={
                    supplier.website.startsWith('http')
                      ? supplier.website
                      : `https://${supplier.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline flex items-center gap-1"
                  title={supplier.website}
                >
                  <span>{supplier.website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="size-2.5 shrink-0" />
                </a>
              )}
              {(supplier.contactEmail || supplier.website) && formattedDate && <span>•</span>}
              {formattedDate && (
                <span>
                  {t('common:created', { defaultValue: 'Додано' }).replace(/:$/, '')}:{' '}
                  {formattedDate}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Switch */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs font-medium ${supplier.isActive ? 'text-success' : 'text-muted-foreground'}`}
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
    </div>
  );
};
