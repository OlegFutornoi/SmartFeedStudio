import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation, getErrorMessage } from '@/i18n';
import { requestPasswordReset } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ForgotPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('');
  const [errorRaw, setErrorRaw] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { t } = useTranslation(['auth', 'common', 'errors']);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorRaw(null);

    if (!email.trim()) {
      setErrorRaw('fillAllFields');
      return;
    }

    setIsLoading(true);

    try {
      const response = await requestPasswordReset(email.trim());
      if (response.resetToken) {
        // Automatically transition directly to the new password setup step
        navigate(`/auth/reset-password?token=${encodeURIComponent(response.resetToken)}`);
      } else {
        setErrorRaw('userNotFound');
      }
    } catch (err: unknown) {
      setErrorRaw(err);
    } finally {
      setIsLoading(false);
    }
  };

  const errorMessage = errorRaw ? getErrorMessage(errorRaw, t) : null;

  return (
    <div
      data-testid="forgot-password-card"
      className={cn('flex flex-col gap-6', className)}
      {...props}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <CardTitle className="text-2xl">{t('forgotPasswordTitle')}</CardTitle>
          </div>
          <CardDescription>{t('forgotPasswordDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form data-testid="forgot-password-form" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-5">
              {errorMessage && (
                <Alert variant="destructive" data-testid="error-alert" className="py-2.5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription data-testid="error-message">{errorMessage}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email">{t('emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="email-input"
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                data-testid="send-reset-button"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('sendingResetLink')}
                  </>
                ) : (
                  t('sendResetLink')
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
