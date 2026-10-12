import { useState } from 'react';
import { HardDrive, RefreshCw, ArrowUpRight, Cloud } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStorageQuota } from '@/hooks/useStorageQuota';
import { UpgradeStoragePromptDialog } from '@/components/storage/UpgradeStoragePromptDialog';
import { cn } from '@/lib/utils';

export interface StorageQuotaBarProps {
  variant?: 'full' | 'compact';
  className?: string;
  onUpgradeClick?: () => void;
}

export function StorageQuotaBar({
  variant = 'full',
  className,
  onUpgradeClick,
}: StorageQuotaBarProps) {
  const { t } = useTranslation(['storage', 'common']);
  const {
    quota,
    isLoading,
    isLocked,
    isOverQuota,
    percentUsed,
    usedFormatted,
    maxFormatted,
    availableFormatted,
    refetch,
  } = useStorageQuota();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      setShowUpgradeModal(true);
    }
  };

  // Dynamic semantic color token based on usage percentage
  const getIndicatorColor = () => {
    if (isLocked) return 'bg-muted-foreground/30';
    if (isOverQuota || percentUsed >= 90) return 'bg-destructive';
    if (percentUsed >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  if (variant === 'compact') {
    return (
      <div
        data-testid="storage-quota-bar-compact"
        className={cn('flex items-center gap-3 text-xs', className)}
      >
        <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
          <Cloud className="size-3.5 text-primary" />
          <span>
            {isLocked ? t('storage:storageNotIncluded') : `${usedFormatted} / ${maxFormatted}`}
          </span>
        </div>
        <Progress
          value={isLocked ? 0 : percentUsed}
          className="h-1.5 w-24 bg-muted"
          indicatorClassName={getIndicatorColor()}
        />
        {isLocked || isOverQuota ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleUpgrade}
            className="h-6 px-1.5 text-[11px] text-primary hover:text-primary/80 font-medium"
            data-testid="compact-upgrade-btn"
          >
            {t('storage:upgradeBtn')}
            <ArrowUpRight className="size-3 ml-0.5" />
          </Button>
        ) : (
          <span className="text-[11px] font-mono text-muted-foreground">{percentUsed}%</span>
        )}
        <UpgradeStoragePromptDialog
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          isOverQuota={isOverQuota}
        />
      </div>
    );
  }

  return (
    <div
      data-testid="storage-quota-bar-full"
      className={cn('p-5 rounded-xl bg-card border border-border shadow-xs space-y-4', className)}
    >
      {/* Header with Title and Cloud Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <HardDrive className="size-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
              {t('storage:cloudStorageUsage')}
              <Badge
                variant="outline"
                className="text-[10px] h-4.5 px-1.5 font-normal border-border bg-muted/40"
              >
                {quota?.planType || 'FREE'}
              </Badge>
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isLocked
                ? t('storage:storageNotIncluded')
                : `${t('storage:usedOf', { used: usedFormatted, max: maxFormatted })} (${percentUsed}%)`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="size-8 p-0 text-muted-foreground hover:text-foreground"
            title={t('storage:refreshQuota')}
            data-testid="refresh-quota-btn"
          >
            <RefreshCw className={cn('size-3.5', isLoading && 'animate-spin')} />
          </Button>
          {(isLocked || percentUsed >= 75) && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleUpgrade}
              className="h-8 text-xs font-medium gap-1 text-primary border-primary/30 hover:bg-primary/5"
              data-testid="full-upgrade-btn"
            >
              {t('storage:upgradeBtn')}
              <ArrowUpRight className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar with Color Coding */}
      <div className="space-y-1.5">
        <Progress
          value={isLocked ? 0 : percentUsed}
          className="h-2 bg-muted/60"
          indicatorClassName={getIndicatorColor()}
        />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            {isLocked
              ? t('storage:upgradeToUnlockStorage')
              : t('storage:available', { available: availableFormatted })}
          </span>
          <span className="font-mono">
            {quota?.totalFilesCount || 0} {t('storage:filesInR2')}
          </span>
        </div>
      </div>

      <UpgradeStoragePromptDialog
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        isOverQuota={isOverQuota}
      />
    </div>
  );
}
