import React from 'react';
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Видалити',
  cancelLabel = 'Скасувати',
  isDestructive = true,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0"
      data-testid="confirm-dialog"
      onClick={isLoading ? undefined : onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 100% Solid Opaque Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl border shrink-0 ${
                isDestructive
                  ? 'bg-destructive/10 text-destructive border-destructive/20'
                  : 'bg-primary/10 text-primary border-primary/20'
              }`}
            >
              {isDestructive ? (
                <Trash2 className="h-4.5 w-4.5" />
              ) : (
                <AlertTriangle className="h-4.5 w-4.5" />
              )}
            </div>
            <h3 className="text-sm font-bold text-foreground sm:text-base leading-tight">
              {title}
            </h3>
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            data-testid="confirm-dialog-close-btn"
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Закрити"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 text-xs text-muted-foreground leading-relaxed">{description}</div>

        {/* 100% Solid Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-border bg-card shrink-0">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={onClose}
            data-testid="confirm-dialog-cancel-btn"
            className="h-8 text-xs px-3"
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant={isDestructive ? 'destructive' : 'default'}
            disabled={isLoading}
            onClick={onConfirm}
            data-testid="confirm-dialog-confirm-btn"
            className="gap-1.5 h-8 text-xs px-3.5 shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isDestructive ? (
              <Trash2 className="h-3.5 w-3.5" />
            ) : null}
            <span>{confirmLabel}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
