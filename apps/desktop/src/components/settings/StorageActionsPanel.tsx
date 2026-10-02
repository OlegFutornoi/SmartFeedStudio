import React from 'react';
import { DownloadCloud, Sparkles, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';

interface StorageActionsPanelProps {
  isBackingUp: boolean;
  isOptimizing: boolean;
  isClearingCache: boolean;
  onBackup: () => void;
  onOptimize: () => void;
  onClearCache: () => void;
}

export const StorageActionsPanel: React.FC<StorageActionsPanelProps> = ({
  isBackingUp,
  isOptimizing,
  isClearingCache,
  onBackup,
  onOptimize,
  onClearCache,
}) => {
  const { t } = useTranslation(['storage', 'common']);

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        {t('storage:actionsTitle')}
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Backup Database */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <DownloadCloud className="size-4 text-primary" />
              <span className="text-xs font-bold text-foreground">{t('storage:createBackup')}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t('storage:tabDescription')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onBackup}
            disabled={isBackingUp}
            className="w-full text-xs h-8 gap-1.5"
            data-testid="create-backup-btn"
          >
            {isBackingUp ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <DownloadCloud className="size-3.5" />
            )}
            <span>{isBackingUp ? t('storage:backupInProgress') : t('storage:createBackup')}</span>
          </Button>
        </div>

        {/* Optimize Database (VACUUM) */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span className="text-xs font-bold text-foreground">{t('storage:vacuumDb')}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t('storage:tabDescription')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onOptimize}
            disabled={isOptimizing}
            className="w-full text-xs h-8 gap-1.5"
            data-testid="vacuum-db-btn"
          >
            {isOptimizing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            <span>{isOptimizing ? t('storage:vacuumInProgress') : t('storage:vacuumDb')}</span>
          </Button>
        </div>

        {/* Clear Cache */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trash2 className="size-4 text-destructive" />
              <span className="text-xs font-bold text-foreground">{t('storage:clearCache')}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t('storage:tabDescription')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearCache}
            disabled={isClearingCache}
            className="w-full text-xs h-8 gap-1.5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            data-testid="clear-cache-btn"
          >
            {isClearingCache ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            <span>
              {isClearingCache ? t('storage:clearCacheInProgress') : t('storage:clearCache')}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};
