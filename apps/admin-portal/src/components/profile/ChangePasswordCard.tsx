'use client';

import React, { useState } from 'react';
import { Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export const ChangePasswordCard = React.memo(function ChangePasswordCard() {
  const { changePassword } = useAuth();
  const { t } = useLanguage();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('settings', 'err_password_failed');
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      data-testid="change-password-card"
      className="border-border/80 bg-card/60 backdrop-blur-sm shadow-md"
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">
            {t('settings', 'change_password_title')}
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          {t('settings', 'change_password_desc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div
            data-testid="change-password-error"
            className="mb-4 flex items-center space-x-2 rounded-lg bg-destructive/15 p-3 text-sm text-destructive border border-destructive/30"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            data-testid="change-password-success"
            className="mb-4 flex items-center space-x-2 rounded-lg bg-primary/10 p-3 text-sm text-primary border border-primary/20"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{t('settings', 'password_updated')}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 w-full">
          <div className="space-y-1.5">
            <Label htmlFor="current-pwd">{t('settings', 'current_password')}</Label>
            <Input
              id="current-pwd"
              data-testid="current-password-input"
              type="password"
              placeholder="••••••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-pwd">{t('settings', 'new_password')}</Label>
            <Input
              id="new-pwd"
              data-testid="new-password-input"
              type="password"
              placeholder="••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-pwd">{t('settings', 'confirm_password')}</Label>
            <Input
              id="confirm-pwd"
              data-testid="confirm-password-input"
              type="password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            data-testid="submit-password-btn"
            disabled={isSubmitting}
            className="mt-2"
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
        </form>
      </CardContent>
    </Card>
  );
});
