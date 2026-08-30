import React from 'react';
import {
  Database,
  FileSpreadsheet,
  Archive,
  Sparkles,
  Package,
  Building2,
  Radio,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import { StorageStatsDto } from '@smartfeed/shared';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface StorageMetricsCardsProps {
  storageStats: StorageStatsDto | null;
}

export const StorageMetricsCards: React.FC<StorageMetricsCardsProps> = ({ storageStats }) => {
  const { t } = useTranslation(['storage', 'common']);

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        {t('storage:metricsTitle')}
      </h4>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Database Size */}
        <div
          className="p-3.5 rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between gap-2"
          data-testid="storage-metric-db"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-medium truncate">
              {t('storage:databaseSize')}
            </span>
            <Database className="size-3.5 text-primary shrink-0" />
          </div>
          <div>
            <div
              className="text-base font-bold font-mono text-foreground"
              data-testid="db-storage-size"
            >
              {formatBytes(storageStats?.databaseSizeBytes || 0)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <Package className="size-2.5" />
              <span data-testid="local-products-count">{storageStats?.productsCount || 0}</span>
              <span>товарів</span>
            </div>
          </div>
        </div>

        {/* Local Feeds Storage */}
        <div
          className="p-3.5 rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between gap-2"
          data-testid="storage-metric-feeds"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-medium truncate">
              {t('storage:feedsStorage')}
            </span>
            <FileSpreadsheet className="size-3.5 text-primary shrink-0" />
          </div>
          <div>
            <div
              className="text-base font-bold font-mono text-foreground"
              data-testid="feeds-storage-size"
            >
              {formatBytes(storageStats?.feedsSizeBytes || 0)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <Radio className="size-2.5" />
              <span data-testid="local-feeds-count">{storageStats?.feedsCount || 0}</span>
              <span>фідів</span>
            </div>
          </div>
        </div>

        {/* Backups Storage */}
        <div
          className="p-3.5 rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between gap-2"
          data-testid="storage-metric-backups"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-medium truncate">
              {t('storage:backupsStorage')}
            </span>
            <Archive className="size-3.5 text-primary shrink-0" />
          </div>
          <div>
            <div
              className="text-base font-bold font-mono text-foreground"
              data-testid="backups-storage-size"
            >
              {formatBytes(storageStats?.backupsSizeBytes || 0)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <Building2 className="size-2.5" />
              <span data-testid="local-suppliers-count">{storageStats?.suppliersCount || 0}</span>
              <span>постач.</span>
            </div>
          </div>
        </div>

        {/* Exports & Logs Storage */}
        <div
          className="p-3.5 rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between gap-2"
          data-testid="storage-metric-cache"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-medium truncate">
              {t('storage:cacheStorage')}
            </span>
            <Sparkles className="size-3.5 text-primary shrink-0" />
          </div>
          <div>
            <div
              className="text-base font-bold font-mono text-foreground"
              data-testid="exports-storage-size"
            >
              {formatBytes(storageStats?.exportsSizeBytes || 0)}
            </div>
            <div className="mt-0.5">
              <Badge
                variant="outline"
                className="text-[9px] font-mono px-1 py-0"
                data-testid="total-storage-size"
              >
                {formatBytes(storageStats?.totalSizeBytes || 0)}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
