import React from 'react';
import { Loader2, XCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';

export interface MediaSyncProgressCardProps {
  isSyncing: boolean;
  progressPercent: number;
  currentFileName: string;
  syncedCount: number;
  totalToSync: number;
  error: string | null;
  onCancel: () => void;
}

export const MediaSyncProgressCard: React.FC<MediaSyncProgressCardProps> = ({
  isSyncing,
  progressPercent,
  currentFileName,
  syncedCount,
  totalToSync,
  error,
  onCancel,
}) => {
  const { t } = useTranslation(['cloud', 'common']);

  if (!isSyncing && !error && syncedCount === 0) return null;

  return (
    <Card
      data-testid="media-sync-progress-card"
      className="border-primary/25 bg-primary/5 shadow-xs transition-all animate-in fade-in duration-200"
    >
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : error ? (
              <XCircle className="h-4 w-4 text-destructive" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            )}
            <span className="text-xs font-semibold text-foreground">
              {isSyncing
                ? t('cloud:syncingInProgress')
                : error
                  ? t('cloud:syncFailed')
                  : t('cloud:syncCompleted')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-foreground tabular-nums">
              {syncedCount} / {totalToSync} ({progressPercent}%)
            </span>
            {isSyncing && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                data-testid="cancel-media-sync-btn"
                className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
              >
                {t('common:cancel')}
              </Button>
            )}
          </div>
        </div>

        <Progress value={progressPercent} className="h-1.5" />

        {currentFileName && (
          <p className="text-[11px] text-muted-foreground truncate font-mono">
            {t('cloud:syncCurrentFile')}: {currentFileName}
          </p>
        )}

        {error && <p className="text-[11px] text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
};
