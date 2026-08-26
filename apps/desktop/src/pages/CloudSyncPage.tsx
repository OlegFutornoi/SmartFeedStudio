import { useState, useEffect } from 'react';
import { Cloud, HardDrive, ShieldCheck, ArrowUpCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { getMyLicense } from '@/lib/api';
import { ExpiredPlanBlocker } from '@/components/layout/ExpiredPlanBlocker';

export function CloudSyncPage() {
  const { language } = useTranslation();
  const isUk = language === 'uk';
  const { token } = useAuth();
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (token) {
      getMyLicense(token)
        .then((lic) => setIsExpired(Boolean(lic?.isExpired)))
        .catch(() => {});
    }
  }, [token]);

  if (isExpired) {
    return <ExpiredPlanBlocker featureName={isUk ? 'Хмарна синхронізація' : 'Cloud Sync'} />;
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
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {isUk ? 'Хмарна синхронізація & Бекап' : 'Cloud Sync & Backups'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isUk
                  ? 'Пряме шифроване збереження знімків каталогів у сховище S3 / MinIO'
                  : 'Encrypted cloud backup snapshots to S3 / MinIO storage'}
              </p>
            </div>
          </div>
        </div>

        <Button className="gap-2 text-xs h-9 shadow-md shadow-primary/25 self-start sm:self-auto">
          <ArrowUpCircle className="h-4 w-4" />
          <span>{isUk ? 'Створити знімок зараз' : 'Create Snapshot Now'}</span>
        </Button>
      </div>

      {/* Cloud Status Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/80 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isUk ? 'Хмарне сховище' : 'Cloud Storage'}
            </CardTitle>
            <HardDrive className="size-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">1.4 GB</div>
            <p className="text-xs text-muted-foreground mt-1">S3 Bucket: `smartfeed-storage`</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isUk ? 'Безпека передачі' : 'Security Mode'}
            </CardTitle>
            <ShieldCheck className="size-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground flex items-center gap-2">
              <span>AES-256</span>
              <Badge
                variant="outline"
                className="text-[10px] text-emerald-400 border-emerald-500/30"
              >
                Active
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isUk ? 'Presigned S3 Direct Upload' : 'Presigned S3 Direct Upload'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isUk ? 'Останній бекап' : 'Last Snapshot'}
            </CardTitle>
            <History className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">18:30</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isUk ? 'Автоматичний щоденний зріз' : 'Automated daily snapshot'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
