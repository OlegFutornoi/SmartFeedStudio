import React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import type { SupplierSyncSettingDto } from '@smartfeed/shared';

interface SupplierSyncStatusBannerProps {
  settings: SupplierSyncSettingDto | null;
  isSyncing: boolean;
  onTriggerSync: () => void;
}

export const SupplierSyncStatusBanner: React.FC<SupplierSyncStatusBannerProps> = ({
  settings,
  isSyncing,
  onTriggerSync,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  const formattedLastSync = settings?.lastSyncedAt
    ? new Date(settings.lastSyncedAt).toLocaleString('uk-UA', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div
      className="p-4 rounded-xl border border-border/80 bg-linear-to-r from-card via-card/90 to-primary/5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5"
      data-testid="supplier-sync-status-banner"
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
          <RefreshCw className={`size-5 ${isSyncing ? 'animate-spin' : ''}`} />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-foreground">
              {t('suppliers:syncBannerTitle', {
                defaultValue: 'Синхронізація товарів постачальника',
              })}
            </h4>
            {settings?.lastSyncStatus === 'SUCCESS' ? (
              <Badge
                variant="outline"
                className="bg-success/15 text-success border-success/30 text-2xs gap-1 py-0"
              >
                <CheckCircle2 className="size-3" />
                {t('suppliers:syncStatusSuccess', { defaultValue: 'Актуально' })}
              </Badge>
            ) : settings?.lastSyncStatus === 'FAILED' ? (
              <Badge
                variant="outline"
                className="bg-destructive/10 text-destructive border-destructive/30 text-2xs gap-1 py-0"
              >
                <AlertCircle className="size-3" />
                {t('suppliers:syncStatusFailed', { defaultValue: 'Помилка' })}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground text-2xs py-0">
                {t('suppliers:syncStatusIdle', { defaultValue: 'Готовий до запуску' })}
              </Badge>
            )}
            {settings?.protectEditedProducts && (
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20 text-2xs gap-1 py-0"
              >
                <ShieldCheck className="size-3" />
                {t('suppliers:badgeProtected', { defaultValue: 'Ручні правки захищено' })}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
            <Clock className="size-3 shrink-0" />
            <span>
              {formattedLastSync
                ? `${t('suppliers:lastSyncedAt', { defaultValue: 'Останнє оновлення:' })} ${formattedLastSync}`
                : t('suppliers:neverSynced', { defaultValue: 'Ще не синхронізувалося' })}
            </span>
            {settings && settings.syncIntervalHours > 0 && (
              <>
                <span>•</span>
                <span>
                  {t('suppliers:autoInterval', { defaultValue: 'Автокожні' })}{' '}
                  {settings.syncIntervalHours} {t('suppliers:hoursShort', { defaultValue: 'год' })}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      <Button
        onClick={onTriggerSync}
        disabled={isSyncing}
        size="sm"
        className="h-9 px-4 gap-2 text-xs font-semibold shrink-0 cursor-pointer shadow-xs"
        data-testid="trigger-sync-btn"
      >
        <RefreshCw className={`size-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        <span>
          {isSyncing
            ? t('suppliers:syncingInProgress', { defaultValue: 'Синхронізація...' })
            : t('suppliers:btnSyncNow', { defaultValue: 'Синхронізувати зараз' })}
        </span>
      </Button>
    </div>
  );
};
