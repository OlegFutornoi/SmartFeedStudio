import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  HardDrive,
  FolderTree,
  ShieldCheck,
  FolderOpen,
  ArrowRight,
  Loader2,
  Database,
  DownloadCloud,
  FileSpreadsheet,
  Archive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/i18n';
import { useWorkspaceStorage } from '@/contexts/WorkspaceStorageContext';
import { pickWorkspaceFolder } from '@/lib/storageApi';

export const FirstRunWorkspaceSetupDialog: React.FC = () => {
  const { t } = useTranslation(['storage', 'common']);
  const { showOnboardingModal, defaultPath, setupWorkspace } = useWorkspaceStorage();

  const [useCustomPath, setUseCustomPath] = useState(false);
  const [customPath, setCustomPath] = useState(defaultPath);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPickingFolder, setIsPickingFolder] = useState(false);

  const handleBrowseFolder = async () => {
    setIsPickingFolder(true);
    try {
      const chosen = await pickWorkspaceFolder();
      if (chosen) {
        setCustomPath(chosen.replace(/\/$/, ''));
      }
    } catch (err) {
      console.warn('Folder picker error:', err);
    } finally {
      setIsPickingFolder(false);
    }
  };

  if (!showOnboardingModal) return null;

  const targetPath = useCustomPath ? customPath.trim() : defaultPath;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPath) return;

    setIsSubmitting(true);
    try {
      await setupWorkspace(targetPath);
    } catch (e) {
      console.error('Failed to setup workspace:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      data-testid="first-run-workspace-dialog"
    >
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* 100% Solid Opaque Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border bg-card shrink-0">
          <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-inner shrink-0">
            <HardDrive className="size-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground sm:text-lg leading-tight">
              {t('storage:onboardingTitle')}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('storage:onboardingSubtitle')}
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-y-auto p-6 space-y-5"
        >
          {/* Path Selection Options */}
          <div className="space-y-3">
            {/* Default System Path Option */}
            <div
              onClick={() => setUseCustomPath(false)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                !useCustomPath
                  ? 'border-primary/50 bg-primary/5 shadow-sm ring-1 ring-primary/20'
                  : 'border-border bg-secondary/20 hover:bg-secondary/40'
              }`}
            >
              <div
                className={`mt-0.5 size-4 rounded-full border flex items-center justify-center shrink-0 ${
                  !useCustomPath
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/40'
                }`}
              >
                {!useCustomPath && <div className="size-1.5 rounded-full bg-white" />}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    {t('storage:defaultPathLabel')}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    Рекомендовано
                  </span>
                </div>
                <p className="text-xs font-mono text-muted-foreground bg-background/80 px-2.5 py-1.5 rounded-lg border border-border/60 break-all select-all">
                  {defaultPath}
                </p>
              </div>
            </div>

            {/* Custom Path Option */}
            <div
              onClick={() => setUseCustomPath(true)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                useCustomPath
                  ? 'border-primary/50 bg-primary/5 shadow-sm ring-1 ring-primary/20'
                  : 'border-border bg-secondary/20 hover:bg-secondary/40'
              }`}
            >
              <div
                className={`mt-0.5 size-4 rounded-full border flex items-center justify-center shrink-0 ${
                  useCustomPath
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/40'
                }`}
              >
                {useCustomPath && <div className="size-1.5 rounded-full bg-white" />}
              </div>
              <div className="flex-1 space-y-2">
                <span className="text-xs font-semibold text-foreground">
                  {t('storage:customPathLabel')}
                </span>
                {useCustomPath && (
                  <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-150">
                    <Input
                      value={customPath}
                      onChange={(e) => setCustomPath(e.target.value)}
                      placeholder="/Users/username/MyData/SmartFeed"
                      className="text-xs font-mono h-9 bg-background"
                      data-testid="custom-workspace-input"
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleBrowseFolder}
                      disabled={isPickingFolder}
                      className="h-9 text-xs gap-1.5 shrink-0"
                      data-testid="browse-workspace-folder-btn"
                    >
                      {isPickingFolder ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <FolderOpen className="size-3.5" />
                      )}
                      <span>{t('storage:browseFolder')}</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Folder Structure Preview */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <FolderTree className="size-4 text-primary" />
              <span>{t('storage:folderStructureTitle')}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground font-mono">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border/40">
                <Database className="size-3.5 text-blue-400 shrink-0" />
                <span className="truncate">database/catalog.db</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border/40">
                <DownloadCloud className="size-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">feeds/ (XML/CSV)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border/40">
                <FileSpreadsheet className="size-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">exports/ (Prom, Rozetka)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border/40">
                <Archive className="size-3.5 text-purple-400 shrink-0" />
                <span className="truncate">backups/ (Snapshots)</span>
              </div>
            </div>
          </div>

          {/* Security & Encryption Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">{t('storage:encryptionNotice')}</p>
          </div>

          {/* 100% Solid Opaque Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-auto">
            <Button
              type="submit"
              disabled={isSubmitting || !targetPath}
              data-testid="init-workspace-btn"
              className="gap-2 text-xs font-semibold shadow-md shadow-primary/25 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>{t('storage:initializing')}</span>
                </>
              ) : (
                <>
                  <span>{t('storage:initButton')}</span>
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
