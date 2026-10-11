import React from 'react';
import { Layers, FileText, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/i18n';

interface ConnectedFeedsMetricsProps {
  totalFeeds: number;
  totalProductsCount: number;
  latestSyncDate: Date | null;
}

export const ConnectedFeedsMetrics: React.FC<ConnectedFeedsMetricsProps> = ({
  totalFeeds,
  totalProductsCount,
  latestSyncDate,
}) => {
  const { t } = useTranslation(['catalogs']);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="border-border/80 bg-card/60 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('catalogs:totalCatalogs')}</CardTitle>
          <Layers className="size-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">{totalFeeds}</div>
          <p className="text-xs text-muted-foreground mt-1">{t('catalogs:activeFeeds')}</p>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/60 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('catalogs:totalSkus')}</CardTitle>
          <FileText className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">
            {totalProductsCount.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Indexed in SQLCipher DB</p>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/60 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('catalogs:lastSynced')}</CardTitle>
          <CheckCircle2
            className={`size-4 ${totalFeeds > 0 ? 'text-foreground' : 'text-muted-foreground'}`}
          />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground flex items-center gap-2">
            <span>{totalFeeds > 0 ? t('catalogs:statusSynced') : t('catalogs:statusIdle')}</span>
            {totalFeeds > 0 && <span className="size-2 rounded-full bg-foreground animate-pulse" />}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {latestSyncDate
              ? latestSyncDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : t('catalogs:neverSynced')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
