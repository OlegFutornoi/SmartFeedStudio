import { Cloud, HardDrive, ShieldCheck, ArrowUpCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import { useLicense } from '@/hooks/useLicense';
import { ExpiredPlanBlocker } from '@/components/layout/ExpiredPlanBlocker';

export function CloudSyncPage() {
  const { t } = useTranslation(['cloud', 'common']);
  const { isExpired } = useLicense();

  if (isExpired) {
    return <ExpiredPlanBlocker featureName={t('cloud:title')} />;
  }

  return (
    <div
      data-testid="cloud-sync-page"
      className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {t('cloud:title')}
              </h1>
              <p className="text-sm text-muted-foreground">{t('cloud:description')}</p>
            </div>
          </div>
        </div>

        <Button className="gap-2 text-xs h-9 shadow-md shadow-primary/25 self-start sm:self-auto">
          <ArrowUpCircle className="h-4 w-4" />
          <span>{t('cloud:createSnapshot')}</span>
        </Button>
      </div>

      {/* Cloud Status Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/80 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cloud:storageUsage')}</CardTitle>
            <HardDrive className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">1.4 GB</div>
            <p className="text-xs text-muted-foreground mt-1">S3 Bucket: `smartfeed-storage`</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cloud:encryptionStatus')}</CardTitle>
            <ShieldCheck className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground flex items-center gap-2">
              <span>AES-256</span>
              <Badge
                variant="outline"
                className="text-[10px] text-primary border-primary/30 bg-primary/5"
              >
                Active
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('cloud:encryptionDesc')}</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cloud:lastBackup')}</CardTitle>
            <History className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">18:30</div>
            <p className="text-xs text-muted-foreground mt-1">Daily Automated Snapshot</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
