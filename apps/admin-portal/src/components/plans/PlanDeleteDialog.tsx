'use client';

import React from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';

interface PlanDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planCode: string | null;
  isUk: boolean;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function PlanDeleteDialog({
  open,
  onOpenChange,
  planCode,
  isUk,
  onConfirm,
  isDeleting,
}: PlanDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="plan-delete-dialog" className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center size-9 rounded-lg bg-destructive/10 text-destructive shrink-0">
              <Trash2 className="size-4" />
            </div>
            <DialogTitle className="text-base font-semibold">
              {isUk ? 'Видалити тарифний план' : 'Delete Tariff Plan'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground ml-[3rem]">
            {isUk ? (
              <>
                Ви впевнені, що хочете видалити тарифний план{' '}
                <span className="font-semibold text-foreground font-mono">
                  &quot;{planCode}&quot;
                </span>
                ? Цю дію неможливо скасувати.
              </>
            ) : (
              <>
                Are you sure you want to delete tariff plan{' '}
                <span className="font-semibold text-foreground font-mono">
                  &quot;{planCode}&quot;
                </span>
                ? This action cannot be undone.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="plan-delete-cancel-btn"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="text-xs h-8 px-4"
          >
            {isUk ? 'Скасувати' : 'Cancel'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            data-testid="plan-delete-confirm-btn"
            onClick={onConfirm}
            disabled={isDeleting}
            className="text-xs h-8 px-4 gap-1.5"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                {isUk ? 'Видалення...' : 'Deleting...'}
              </>
            ) : (
              <>
                <Trash2 className="size-3.5" />
                {isUk ? 'Видалити' : 'Delete'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
