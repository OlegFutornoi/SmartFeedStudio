import React from 'react';
import { ArrowLeft, RefreshCw, Edit2, Trash2, Globe, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { SupplierDto, getCurrencySymbol } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';
import { SupplierAvatar } from '@/modules/suppliers/components/common/SupplierAvatar';

interface SupplierDetailHeaderProps {
  supplier: SupplierDto;
  isSyncing?: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSyncFeeds: () => void;
  onToggleStatus: () => void;
}

export const SupplierDetailHeader: React.FC<SupplierDetailHeaderProps> = ({
  supplier,
  isSyncing,
  onBack,
  onEdit,
  onDelete,
  onSyncFeeds,
  onToggleStatus,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  const currencySym = getCurrencySymbol(supplier.baseCurrency || 'UAH');

  return (
    <div
      className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-4"
      data-testid="supplier-detail-header"
    >
      {/* Top action row */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5 -ml-2"
          data-testid="back-to-suppliers-btn"
        >
          <ArrowLeft className="size-3.5" />
          {t('suppliers:backToList', { defaultValue: 'Назад до постачальників' })}
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSyncFeeds}
            disabled={isSyncing}
            className="h-8 text-xs gap-1.5"
            data-testid="sync-feeds-btn"
          >
            <RefreshCw className={`size-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {t('suppliers:syncFeeds', { defaultValue: 'Синхронізувати фіди' })}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="h-8 text-xs gap-1.5"
            data-testid="edit-supplier-btn"
          >
            <Edit2 className="size-3.5" />
            {t('common:edit', { defaultValue: 'Редагувати' })}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
            data-testid="delete-supplier-btn"
          >
            <Trash2 className="size-3.5" />
            {t('common:delete', { defaultValue: 'Видалити' })}
          </Button>
        </div>
      </div>

      {/* Main Vendor Info & Quick Metrics */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 pt-1">
        {/* Left: Avatar & Meta */}
        <div className="flex items-center gap-4">
          <SupplierAvatar
            logoUrl={supplier.logoUrl}
            name={supplier.name}
            size="lg"
            dataTestId="supplier-detail-avatar"
          />
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-foreground">{supplier.name}</h2>
              <span className="text-xs font-mono text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded border border-border/60">
                {supplier.code}
              </span>
              <div
                className="flex items-center gap-2 bg-muted/60 px-2.5 py-1 rounded-full border border-border/70"
                data-testid="supplier-active-toggle-container"
              >
                <Switch
                  checked={supplier.isActive}
                  onCheckedChange={onToggleStatus}
                  aria-label={t('suppliers:status', { defaultValue: 'Статус' })}
                  data-testid="supplier-active-toggle"
                  className="scale-75"
                />
                <span
                  className={`text-xs font-medium select-none ${
                    supplier.isActive ? 'text-success font-semibold' : 'text-muted-foreground'
                  }`}
                  data-testid="supplier-active-status-text"
                >
                  {supplier.isActive
                    ? t('suppliers:statusActive', { defaultValue: 'Активний' })
                    : t('suppliers:statusInactive', { defaultValue: 'Неактивний' })}
                </span>
              </div>
            </div>

            {/* Contact Pills */}
            <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-muted-foreground">
              {supplier.contactEmail && (
                <a
                  href={`mailto:${supplier.contactEmail}`}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Mail className="size-3.5 text-muted-foreground" />
                  <span>{supplier.contactEmail}</span>
                </a>
              )}
              {supplier.contactPhone && /\d/.test(supplier.contactPhone) && (
                <a
                  href={`tel:${supplier.contactPhone}`}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Phone className="size-3.5 text-muted-foreground" />
                  <span>{supplier.contactPhone}</span>
                </a>
              )}
              {supplier.website && (
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors inline-flex items-center"
                  title={supplier.website}
                  data-testid="supplier-detail-website-icon"
                >
                  <Globe className="size-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right: 4 Quick Stats Badges */}
        <div className="flex items-center gap-3 sm:gap-6 bg-muted/40 px-4 py-2.5 rounded-xl border border-border/60 self-stretch md:self-auto justify-between sm:justify-start">
          <div className="text-center">
            <span className="text-xs text-muted-foreground block">
              {t('suppliers:columnProducts', { defaultValue: 'Товари' })}
            </span>
            <span className="text-base font-bold font-mono text-foreground">
              {(supplier.productsCount || 0).toLocaleString()}
            </span>
          </div>
          <div className="h-7 w-px bg-border/80" />
          <div className="text-center">
            <span className="text-xs text-muted-foreground block">
              {t('suppliers:columnFeeds', { defaultValue: 'Фіди' })}
            </span>
            <span className="text-base font-bold font-mono text-foreground">
              {supplier.activeFeedsCount || 0}
            </span>
          </div>
          <div className="h-7 w-px bg-border/80" />
          <div className="text-center">
            <span className="text-xs text-muted-foreground block">
              {t('suppliers:tabCategories', { defaultValue: 'Категорії' })}
            </span>
            <span className="text-base font-bold font-mono text-foreground">
              {supplier.activeCategoriesCount || 0} / {supplier.categoriesCount || 0}
            </span>
          </div>
          <div className="h-7 w-px bg-border/80" />
          <div className="text-center">
            <span className="text-xs text-muted-foreground block">
              {t('suppliers:currency', { defaultValue: 'Валюта' })}
            </span>
            <span className="text-base font-bold font-mono text-primary">
              {supplier.baseCurrency || 'UAH'} ({currencySym})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
