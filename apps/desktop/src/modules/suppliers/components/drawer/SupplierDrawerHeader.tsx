import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Package, Rss, FolderTree, TrendingUp, ExternalLink } from 'lucide-react';
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
      className="p-5 pb-4 border-b border-border/80 bg-card/60 backdrop-blur-xs space-y-3.5 pr-10"
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
                  {t('suppliers:lastSynced', { defaultValue: 'Додано' })}: {formattedDate}
                </span>
              )}
            </div>
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

      {/* Commerceo Top KPI Statistics Row */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border/50"
        data-testid="supplier-drawer-kpi-row"
      >
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/50">
          <Package className="size-3.5 text-primary shrink-0" />
          <div className="min-w-0">
            <div className="text-2xs text-muted-foreground truncate">
              {t('suppliers:columnProducts', { defaultValue: 'Товари' })}
            </div>
            <div className="text-xs font-bold text-foreground tabular-nums">
              {supplier.productsCount || 0}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/50">
          <Rss className="size-3.5 text-primary shrink-0" />
          <div className="min-w-0">
            <div className="text-2xs text-muted-foreground truncate">
              {t('suppliers:columnFeeds', { defaultValue: 'Джерела фідів' })}
            </div>
            <div className="text-xs font-bold text-foreground tabular-nums">
              {supplier.activeFeedsCount || 0}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/50">
          <FolderTree className="size-3.5 text-primary shrink-0" />
          <div className="min-w-0">
            <div className="text-2xs text-muted-foreground truncate">
              {t('suppliers:tabCategories', { defaultValue: 'Категорії' })}
            </div>
            <div className="text-xs font-bold text-foreground tabular-nums">
              {supplier.categoriesCount || supplier.activeCategoriesCount || 0}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/50">
          <TrendingUp className="size-3.5 text-primary shrink-0" />
          <div className="min-w-0">
            <div className="text-2xs text-muted-foreground truncate">
              {t('suppliers:columnCurrencyMarkup', { defaultValue: 'Націнка' })}
            </div>
            <div className="text-xs font-bold text-foreground tabular-nums">
              +{supplier.defaultMarginPercent || 0}% ({supplier.baseCurrency || 'UAH'})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
