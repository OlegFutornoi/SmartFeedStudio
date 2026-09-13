import React, { useState } from 'react';
import {
  HardDrive,
  FolderOpen,
  FolderSync,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import { useWorkspaceStorage } from '@/contexts/WorkspaceStorageContext';
import { MigrateWorkspaceDialog } from '@/components/storage/MigrateWorkspaceDialog';
import { StorageMetricsCards } from './StorageMetricsCards';
import { StorageActionsPanel } from './StorageActionsPanel';

export const SettingsStorageTab: React.FC = () => {
  const { t } = useTranslation(['storage', 'common']);
  const {
    workspaceInfo,
    storageStats,
    openFolder,
    backupDatabase,
    optimizeDatabase,
    clearCache,
    defaultPath,
  } = useWorkspaceStorage();

  const [isMigrateOpen, setIsMigrateOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  const [copied, setCopied] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const activePath = workspaceInfo?.workspacePath || defaultPath;

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(activePath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('[SettingsStorageTab:handleCopyPath] Failed to copy path to clipboard:', e);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    setActionSuccessMessage(null);
    try {
      const backupPath = await backupDatabase();
      setActionSuccessMessage(`${t('storage:backupSuccess')}: ${backupPath}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setActionSuccessMessage(null);
    try {
      await optimizeDatabase();
      setActionSuccessMessage(t('storage:vacuumSuccess'));
    } catch (e) {
      console.error(e);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    setActionSuccessMessage(null);
    try {
      await clearCache();
      setActionSuccessMessage(t('storage:clearCacheSuccess'));
    } catch (e) {
      console.error(e);
    } finally {
      setIsClearingCache(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" data-testid="settings-storage-tab">
      {/* Header Info */}
      <div className="space-y-1">
        <h3 className="text-base font-bold text-foreground sm:text-lg">{t('storage:tabTitle')}</h3>
        <p className="text-xs text-muted-foreground">{t('storage:tabDescription')}</p>
      </div>

      {/* Success Alert */}
      {actionSuccessMessage && (
        <div
          className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 animate-in fade-in duration-150"
          data-testid="storage-action-success-alert"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
            <span className="font-medium">{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Active Workspace Card */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <HardDrive className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-foreground">
                  {t('storage:activeWorkspace')}
                </h4>
                <Badge
                  variant="outline"
                  className="text-[10px] gap-1 text-emerald-500 border-emerald-500/30 bg-emerald-500/10 font-mono"
                >
                  <ShieldCheck className="size-3" />
                  <span>{t('storage:encryptionStatus')}</span>
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('storage:activeWorkspaceDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openFolder}
              className="text-xs h-8 gap-1.5"
              data-testid="open-explorer-btn"
            >
              <FolderOpen className="size-3.5" />
              <span>{t('storage:openInExplorer')}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMigrateOpen(true)}
              className="text-xs h-8 gap-1.5"
              data-testid="change-workspace-btn"
            >
              <FolderSync className="size-3.5" />
              <span>{t('storage:changeWorkspace')}</span>
            </Button>
          </div>
        </div>

        {/* Path Display */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40 border border-border/80 text-xs font-mono text-foreground gap-2">
          <span className="truncate" title={activePath} data-testid="active-workspace-path">
            {activePath}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyPath}
            className="size-7 text-muted-foreground hover:text-foreground shrink-0"
            title={t('storage:copyPath')}
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-400" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Metrics Section */}
      <StorageMetricsCards storageStats={storageStats} />

      {/* Database Maintenance & Actions */}
      <StorageActionsPanel
        isBackingUp={isBackingUp}
        isOptimizing={isOptimizing}
        isClearingCache={isClearingCache}
        onBackup={handleBackup}
        onOptimize={handleOptimize}
        onClearCache={handleClearCache}
      />

      {/* Migration Modal Dialog */}
      <MigrateWorkspaceDialog
        isOpen={isMigrateOpen}
        onClose={() => setIsMigrateOpen(false)}
        currentPath={activePath}
      />
    </div>
  );
};
