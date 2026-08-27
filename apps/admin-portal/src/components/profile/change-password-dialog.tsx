'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { KeyRound, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { changePassword } = useAuth();
  const { t } = useLanguage();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError(t('settings', 'err_password_min'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('settings', 'err_password_mismatch'));
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('settings', 'err_password_failed');
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="change-password-modal" className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>{t('settings', 'change_password_title')}</DialogTitle>
              <DialogDescription>{t('settings', 'change_password_desc')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div
            data-testid="modal-password-error"
            className="flex items-center space-x-2 rounded-lg bg-destructive/15 p-3 text-sm text-destructive border border-destructive/30"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            data-testid="modal-password-success"
            className="flex items-center space-x-2 rounded-lg bg-emerald-500/15 p-3 text-sm text-emerald-400 border border-emerald-500/30"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{t('settings', 'password_updated')}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="modal-current-password">{t('settings', 'current_password')}</Label>
            <Input
              id="modal-current-password"
              data-testid="modal-current-password"
              type="password"
              placeholder="••••••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={isSubmitting || success}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="modal-new-password">{t('settings', 'new_password')}</Label>
            <Input
              id="modal-new-password"
              data-testid="modal-new-password"
              type="password"
              placeholder="••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isSubmitting || success}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="modal-confirm-password">{t('settings', 'confirm_password')}</Label>
            <Input
              id="modal-confirm-password"
              data-testid="modal-confirm-password"
              type="password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting || success}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common', 'cancel')}
            </Button>
            <Button
              type="submit"
              data-testid="modal-submit-password-btn"
              disabled={isSubmitting || success}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common', 'saving')}
                </>
              ) : (
                t('settings', 'save_password')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
