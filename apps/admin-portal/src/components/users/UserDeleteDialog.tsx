'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { UserListItemDto } from '@smartfeed/shared';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface UserDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserListItemDto | null;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function UserDeleteDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
  isDeleting,
}: UserDeleteDialogProps) {
  const { t, locale } = useLanguage();
  const isUk = locale === 'uk';

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid={`user-delete-modal-${user.id}`} className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-destructive mb-1">
            <AlertTriangle className="size-5" />
            <DialogTitle className="text-base font-semibold">
              {t('users', 'delete_dialog_title')}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {isUk ? (
              <>
                Ви впевнені, що хочете остаточно видалити обліковий запис користувача{' '}
                <span className="font-semibold text-foreground">{user.fullName || user.email}</span>{' '}
                (<span className="font-mono text-foreground">{user.email}</span>)? Всі
                пов&apos;язані ліцензії, організації та доступи будуть анульовані. Цю дію неможливо
                скасувати.
              </>
            ) : (
              <>
                Are you sure you want to permanently delete user account{' '}
                <span className="font-semibold text-foreground">{user.fullName || user.email}</span>{' '}
                (<span className="font-mono text-foreground">{user.email}</span>)? All associated
                licenses, organizations, and access tokens will be revoked. This action cannot be
                undone.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="user-delete-cancel-btn"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="text-xs h-8"
          >
            {t('users', 'btn_cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            data-testid="user-delete-confirm-btn"
            onClick={onConfirm}
            disabled={isDeleting}
            className="text-xs h-8 gap-1.5"
          >
            {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
            <span>{t('users', 'btn_delete_confirm')}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
