import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation, getErrorMessage } from '@/i18n';
import { resetPassword } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ResetPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorRaw, setErrorRaw] = useState<unknown | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { t } = useTranslation(['auth', 'common', 'errors']);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorRaw(null);
    setSuccessMessage(null);

    if (!token.trim()) {
      setErrorRaw('invalidToken');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setErrorRaw('fillAllFields');
      return;
    }

    if (newPassword.length < 8) {
      setErrorRaw('passwordTooShort');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorRaw('passwordsMismatch');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token.trim(), newPassword);
      setSuccessMessage(t('passwordResetSuccess'));
      setTimeout(() => {
        navigate('/auth/login', { replace: true });
      }, 1500);
    } catch (err: unknown) {
      setErrorRaw(err);
    } finally {
      setIsLoading(false);
    }
  };

  const errorMessage = errorRaw ? getErrorMessage(errorRaw, t) : null;

  return (
    <div
      data-testid="reset-password-card"
      className={cn('flex flex-col gap-6', className)}
      {...props}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <CardTitle className="text-2xl">{t('resetPasswordTitle')}</CardTitle>
          </div>
          <CardDescription>{t('resetPasswordDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form data-testid="reset-password-form" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-5">
              {errorMessage && (
                <Alert variant="destructive" data-testid="error-alert" className="py-2.5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription data-testid="error-message">{errorMessage}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert
                  data-testid="success-alert"
                  className="py-2.5 border-border bg-muted/60 text-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 text-foreground" />
                  <AlertDescription data-testid="success-message">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              {/* Hidden token field for seamless background token handling */}
              <input type="hidden" data-testid="token-input" value={token} />

              <div className="grid gap-2">
                <Label htmlFor="new-password">{t('newPasswordLabel')}</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder={t('newPasswordPlaceholder')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  data-testid="new-password-input"
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirm-password">{t('confirmNewPasswordLabel')}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder={t('confirmNewPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  data-testid="confirm-password-input"
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                data-testid="reset-password-button"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('resettingPassword')}
                  </>
                ) : (
                  t('resetPasswordButton')
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <Link
                  to="/auth/login"
                  data-testid="back-to-login-link"
                  className="inline-flex items-center gap-1.5 underline underline-offset-4 text-foreground font-medium hover:text-primary transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t('backToLogin')}
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
