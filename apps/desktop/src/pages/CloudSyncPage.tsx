import { ShieldCheck, ArrowUpCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import { useLicense } from '@/hooks/useLicense';
import { ExpiredPlanBlocker } from '@/components/layout/ExpiredPlanBlocker';
import { StorageQuotaBar } from '@/components/storage/StorageQuotaBar';

export function CloudSyncPage() {
  const { t } = useTranslation(['cloud', 'common']);
  const { isExpired } = useLicense();

  if (isExpired) {
    return <ExpiredPlanBlocker featureName={t('cloud:title')} />;
  }

  return (
    <div
      data-testid="cloud-sync-page"
      className="max-w-6xl mx-auto space-y-5 animate-in fade-in duration-300"
    >
      {/* Top Action Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{t('cloud:title')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cloudflare R2 Storage & Automated Cloud Snapshots
          </p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-8 shadow-xs">
          <ArrowUpCircle className="h-3.5 w-3.5" />
          <span>{t('cloud:createSnapshot')}</span>
        </Button>
      </div>

      {/* Live Cloudflare R2 Quota Widget */}
      <StorageQuotaBar variant="full" />

      {/* Cloud Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/80 bg-card shadow-xs transition-all hover:border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {t('cloud:encryptionStatus')}
            </CardTitle>
            <ShieldCheck className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>AES-256</span>
              <Badge
                variant="outline"
                className="text-[10px] text-primary border-primary/30 bg-primary/5 font-mono"
              >
                Active
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('cloud:encryptionDesc')}</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card shadow-xs transition-all hover:border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {t('cloud:lastBackup')}
            </CardTitle>
            <History className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
              18:30
            </div>
            <p className="text-xs text-muted-foreground mt-1">Daily Automated Snapshot</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
