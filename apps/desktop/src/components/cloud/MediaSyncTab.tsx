import React from 'react';
import { Cloud, HardDrive, Globe, Images, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import { useCatalogMediaStats } from '@/hooks/useCatalogMediaStats';
import { useCatalogMediaSync } from '@/hooks/useCatalogMediaSync';
import { MediaSyncProgressCard } from '@/components/cloud/MediaSyncProgressCard';
import { formatBytes } from '@/lib/formatters';

export const MediaSyncTab: React.FC = () => {
  const { t } = useTranslation(['cloud', 'catalogs', 'common']);
  const stats = useCatalogMediaStats();

  const sync = useCatalogMediaSync(() => {
    stats.refresh();
  });

  const pendingToSync = stats.totalImages - stats.syncedCloudCount;

  return (
    <div data-testid="media-sync-tab" className="space-y-4">
      {/* Grid of 4 Catalog Media Status Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Images */}
        <Card className="border-border/80 bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t('cloud:totalCatalogPhotos')}
            </CardTitle>
            <Images className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3.5 pb-3">
            <div className="text-xl font-bold tracking-tight text-foreground tabular-nums">
              {stats.totalImages}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stats.totalProducts} {t('catalogs:products')} • {formatBytes(stats.totalSizeBytes)}
            </p>
          </CardContent>
        </Card>

        {/* In Cloudflare R2 */}
        <Card className="border-emerald-500/20 bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t('cloud:inCloudflareR2')}
            </CardTitle>
            <Cloud className="h-3.5 w-3.5 text-emerald-500" />
          </CardHeader>
          <CardContent className="px-3.5 pb-3">
            <div className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 tabular-nums">
              <span>{stats.syncedCloudCount}</span>
              <Badge
                variant="outline"
                className="text-2xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5 font-mono"
              >
                {stats.syncedPercentage}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{t('cloud:cdnActive')}</p>
          </CardContent>
        </Card>

        {/* Stored Locally */}
        <Card className="border-border/80 bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t('cloud:storedLocally')}
            </CardTitle>
            <HardDrive className="h-3.5 w-3.5 text-primary" />
          </CardHeader>
          <CardContent className="px-3.5 pb-3">
            <div className="text-xl font-bold tracking-tight text-foreground tabular-nums">
              {stats.localOnlyCount}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{t('cloud:readyToUpload')}</p>
          </CardContent>
        </Card>

        {/* Remote Supplier URLs */}
        <Card className="border-border/80 bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t('cloud:remoteSupplierUrls')}
            </CardTitle>
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3.5 pb-3">
            <div className="text-xl font-bold tracking-tight text-foreground tabular-nums">
              {stats.remoteUrlsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{t('cloud:hotlinkSupplier')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Primary Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div className="space-y-0.5">
          <h4 className="text-xs font-semibold text-foreground">
            {pendingToSync > 0
              ? `${t('cloud:needSyncTitle')}: ${pendingToSync} ${t('cloud:photosPending')}`
              : t('cloud:allSyncedTitle')}
          </h4>
          <p className="text-xs text-muted-foreground">
            {pendingToSync > 0 ? t('cloud:needSyncDesc') : t('cloud:allSyncedDesc')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => stats.refresh()}
            disabled={stats.isLoading || sync.isSyncing}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3 w-3 ${stats.isLoading ? 'animate-spin' : ''}`} />
            <span>{t('cloud:refreshStats')}</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => sync.startSync()}
            disabled={sync.isSyncing || pendingToSync === 0}
            data-testid="sync-all-media-btn"
            className="h-8 text-xs gap-1.5 font-medium shadow-xs"
          >
            <ArrowUpCircle className="h-3.5 w-3.5" />
            <span>
              {sync.isSyncing ? t('cloud:syncingInProgressBtn') : t('cloud:syncAllPhotosBtn')}
            </span>
          </Button>
        </div>
      </div>

      {/* In-Flight Progress Card */}
      <MediaSyncProgressCard
        isSyncing={sync.isSyncing}
        progressPercent={sync.progressPercent}
        currentFileName={sync.currentFileName}
        syncedCount={sync.syncedCount}
        totalToSync={sync.totalToSync}
        error={sync.error}
        onCancel={sync.cancelSync}
      />
    </div>
  );
};
