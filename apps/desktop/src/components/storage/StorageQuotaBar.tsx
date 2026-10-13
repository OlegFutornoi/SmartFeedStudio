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
      className={cn(
        'px-4 py-2.5 rounded-xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3',
        className,
      )}
    >
      {/* Left: Icon + Storage Info */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
          <HardDrive className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-foreground truncate">
              {t('storage:cloudStorageUsage')}
            </h4>
            <Badge
              variant="outline"
              className="text-[10px] h-4 px-1.5 font-normal border-border bg-muted/40 shrink-0"
            >
              {quota?.planType || 'FREE'}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground truncate">
            {isLocked
              ? t('storage:storageNotIncluded')
              : `${usedFormatted} / ${maxFormatted} (${percentUsed}%)`}
          </p>
        </div>
      </div>

      {/* Right: Progress bar + File count + Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <Progress
              value={isLocked ? 0 : percentUsed}
              className="h-1.5 w-28 sm:w-40 bg-muted/60"
              indicatorClassName={getIndicatorColor()}
            />
            <span className="text-[11px] font-mono tabular-nums text-muted-foreground">
              {percentUsed}%
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {quota?.totalFilesCount || 0} {t('storage:filesInR2')}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="size-7 p-0 text-muted-foreground hover:text-foreground"
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
              className="h-7 text-[11px] px-2 font-medium gap-1 text-primary border-primary/30 hover:bg-primary/5"
              data-testid="full-upgrade-btn"
            >
              {t('storage:upgradeBtn')}
              <ArrowUpRight className="size-3" />
            </Button>
          )}
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
