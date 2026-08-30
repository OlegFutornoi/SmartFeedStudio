import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FolderSync, FolderOpen, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/i18n';
import { useWorkspaceStorage } from '@/contexts/WorkspaceStorageContext';

interface MigrateWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
}

export const MigrateWorkspaceDialog: React.FC<MigrateWorkspaceDialogProps> = ({
  isOpen,
  onClose,
  currentPath,
}) => {
  const { t } = useTranslation(['storage', 'common']);
  const { setupWorkspace } = useWorkspaceStorage();

  const [newPath, setNewPath] = useState(currentPath);
  const [moveExistingData, setMoveExistingData] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPath.trim();
    if (!trimmed || trimmed === currentPath) {
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      await setupWorkspace(trimmed);
      onClose();
    } catch (e) {
      console.error('Failed to migrate workspace:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      data-testid="migrate-workspace-dialog"
      onClick={isLoading ? undefined : onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 100% Solid Opaque Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <FolderSync className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground sm:text-base leading-tight">
                {t('storage:migrateTitle')}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('storage:migrateDescription')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {t('storage:selectedPath')}
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                placeholder="/Users/username/NewData/SmartFeed"
                className="text-xs font-mono h-9 bg-background"
                data-testid="new-workspace-input"
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 text-xs gap-1.5 shrink-0"
              >
                <FolderOpen className="size-3.5" />
                <span>{t('storage:browseFolder')}</span>
              </Button>
            </div>
          </div>

          <div
            onClick={() => setMoveExistingData(!moveExistingData)}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-border/60 bg-secondary/20 hover:bg-secondary/40 cursor-pointer transition-colors"
          >
            <div
              className={`size-4 rounded border flex items-center justify-center transition-colors ${
                moveExistingData
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground/40'
              }`}
            >
              {moveExistingData && <CheckCircle2 className="size-3" />}
            </div>
            <span className="text-xs font-medium text-foreground">
              {t('storage:moveExistingData')}
            </span>
          </div>

          {/* 100% Solid Opaque Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="text-xs h-8"
            >
              {t('common:cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !newPath.trim() || newPath.trim() === currentPath}
              data-testid="confirm-migrate-btn"
              className="gap-1.5 text-xs h-8 font-semibold shadow-sm"
            >
              {isLoading && <Loader2 className="size-3.5 animate-spin" />}
              <span>{isLoading ? t('storage:migrating') : t('storage:migrateButton')}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
