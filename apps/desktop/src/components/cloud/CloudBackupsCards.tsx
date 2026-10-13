import React from 'react';
import { Database, HardDrive, Cloud } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import { formatBytes } from '@/lib/formatters';
import type { StorageFileDto } from '@smartfeed/shared';

interface CloudBackupsCardsProps {
  productsCount: number;
  categoriesCount: number;
  latestBackup?: StorageFileDto;
}

export const CloudBackupsCards: React.FC<CloudBackupsCardsProps> = ({
  productsCount,
  categoriesCount,
  latestBackup,
}) => {
  const { t } = useTranslation(['cloud', 'common']);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {/* Current Catalog Info */}
      <Card className="border-border/80 bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {t('cloud:currentCatalogState')}
          </CardTitle>
          <Database className="h-3.5 w-3.5 text-primary" />
        </CardHeader>
        <CardContent className="px-3.5 pb-3">
          <div className="text-xl font-bold tracking-tight text-foreground tabular-nums">
            {productsCount} {t('cloud:productsCountLabel')}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {categoriesCount} {t('cloud:categoriesCountLabel')} • {t('cloud:readyToBackup')}
          </p>
        </CardContent>
      </Card>

      {/* Latest Backup Info */}
      <Card className="border-border/80 bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {t('cloud:lastBackup')}
          </CardTitle>
          <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-3.5 pb-3">
          <div className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {latestBackup ? (
              <>
                <span className="tabular-nums">
                  {new Date(latestBackup.createdAt).toLocaleDateString()}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/5"
                >
                  {formatBytes(latestBackup.sizeBytes)}
                </Badge>
              </>
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                {t('cloud:noBackupsYet')}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {latestBackup
              ? new Date(latestBackup.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : t('cloud:readyToBackup')}
          </p>
        </CardContent>
      </Card>

      {/* Cloudflare R2 Protection */}
      <Card className="border-border/80 bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3.5 space-y-0">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {t('cloud:cloudProtection')}
          </CardTitle>
          <Cloud className="h-3.5 w-3.5 text-emerald-500" />
        </CardHeader>
        <CardContent className="px-3.5 pb-3">
          <div className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Cloudflare R2</span>
            <Badge
              variant="outline"
              className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/5"
            >
              ACTIVE
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {t('cloud:cloudProtectionDesc')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
