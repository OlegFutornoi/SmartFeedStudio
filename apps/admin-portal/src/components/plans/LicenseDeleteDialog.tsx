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
import { AdminLicenseItemDto } from '@smartfeed/shared';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface LicenseDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  license: AdminLicenseItemDto | null;
  isUk: boolean;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function LicenseDeleteDialog({
  open,
  onOpenChange,
  license,
  isUk,
  onConfirm,
  isDeleting,
}: LicenseDeleteDialogProps) {
  if (!license) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid={`license-delete-modal-${license.licenseKey}`}
        className="sm:max-w-[420px]"
      >
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-destructive mb-1">
            <AlertTriangle className="size-5" />
            <DialogTitle className="text-base font-semibold">
              {isUk ? 'Видалити ліцензію?' : 'Delete License?'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {isUk ? (
              <>
                Ви впевнені, що хочете остаточно видалити ліцензію{' '}
                <span className="font-mono font-semibold text-foreground">
                  {license.licenseKey}
                </span>{' '}
                для користувача{' '}
                <span className="font-semibold text-foreground">
                  {license.user?.email || license.user?.fullName}
                </span>
                ? Цю дію неможливо скасувати.
              </>
            ) : (
              <>
                Are you sure you want to permanently delete license{' '}
                <span className="font-mono font-semibold text-foreground">
                  {license.licenseKey}
                </span>{' '}
                for user{' '}
                <span className="font-semibold text-foreground">
                  {license.user?.email || license.user?.fullName}
                </span>
                ? This action cannot be undone.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="license-delete-cancel-btn"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="text-xs h-8"
          >
            {isUk ? 'Скасувати' : 'Cancel'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            data-testid="license-delete-confirm-btn"
            onClick={onConfirm}
            disabled={isDeleting}
            className="text-xs h-8 gap-1.5"
          >
            {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
            <span>{isUk ? 'Видалити' : 'Delete'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
