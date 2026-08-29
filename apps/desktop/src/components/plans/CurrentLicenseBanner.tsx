import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import type { LicenseEntity } from '@smartfeed/shared';

interface CurrentLicenseBannerProps {
  currentLicense: LicenseEntity;
}

export function CurrentLicenseBanner({ currentLicense }: CurrentLicenseBannerProps) {
  const { t } = useTranslation(['plans', 'common']);

  return (
    <div
      className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-xs space-y-4"
      data-testid="current-license-card"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">
              {t('plans.currentPlan')}
            </div>
            <div className="text-base font-bold text-foreground" data-testid="current-plan-name">
              {currentLicense.tariffPlan?.nameUk ||
                currentLicense.tariffPlan?.nameEn ||
                currentLicense.planType}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={currentLicense.isExpired ? 'destructive' : 'default'}
            className="text-xs px-2.5 py-0.5"
            data-testid="current-plan-status-badge"
          >
            {currentLicense.isExpired
              ? t('plans.expiredBadge')
              : `${t('plans.active')} • ${t('plans.daysRemaining', { count: currentLicense.daysRemaining ?? 0 })}`}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
          <div className="text-xs text-muted-foreground">{t('plans.xmlQuota')}</div>
          <div className="text-lg font-bold text-foreground mt-0.5">
            {currentLicense.maxXmlLimit?.toLocaleString()} SKU
          </div>
        </div>

        <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
          <div className="text-xs text-muted-foreground">{t('plans.aiCreditsQuota')}</div>
          <div className="text-lg font-bold text-foreground mt-0.5">
            {currentLicense.aiCredits?.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
          <div className="text-xs text-muted-foreground">{t('plans.channelsLimit')}</div>
          <div className="text-lg font-bold text-foreground mt-0.5">
            {currentLicense.maxChannelsLimit ?? 1}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
          <div className="text-xs text-muted-foreground">{t('plans.cloudBackup')}</div>
          <div className="text-lg font-bold text-emerald-500 mt-0.5">
            {currentLicense.canCloudBackup ? 'S3 MinIO / AWS' : 'Ні'}
          </div>
        </div>
      </div>
    </div>
  );
}
