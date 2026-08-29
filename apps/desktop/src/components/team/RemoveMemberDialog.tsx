import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';

import type { OrganizationMemberDto } from '@smartfeed/shared';

interface RemoveMemberDialogProps {
  isOpen: boolean;
  member: OrganizationMemberDto | null;
  onClose: () => void;
  onConfirm: (memberId: string) => Promise<void>;
}

export const RemoveMemberDialog: React.FC<RemoveMemberDialogProps> = ({
  isOpen,
  member,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation(['team', 'common']);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !member) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(member.id);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const userEmail = member.userEmail || (member as any).email || '';
  const userFullName = member.userFullName || (member as any).fullName || '';
  const displayName = userFullName ? `${userFullName} (${userEmail})` : userEmail;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-200"
      data-testid="remove-member-dialog"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-destructive/30 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          data-testid="close-remove-dialog-btn"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label={t('team.cancel')}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center pb-3">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-foreground">{t('team.removeModalTitle')}</h2>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            {t('team.removeModalDesc', { name: displayName, email: userEmail })}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            data-testid="cancel-remove-member-btn"
          >
            {t('team.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={isLoading}
            data-testid="confirm-remove-member-btn"
            className="gap-2 font-semibold"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            <span>{isLoading ? t('team.removing') : t('team.confirmRemove')}</span>
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
