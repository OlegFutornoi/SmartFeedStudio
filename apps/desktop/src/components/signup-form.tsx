import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation, getErrorMessage } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { captureException } from '@/lib/sentry';

export function SignupForm({ className, ...props }: React.ComponentPropsWithoutRef<typeof Card>) {
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorRaw, setErrorRaw] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { t } = useTranslation(['auth', 'common', 'errors']);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorRaw(null);

    if (!email.trim() || !password) {
      setErrorRaw('fillAllFields');
      return;
    }

    if (password.length < 8) {
      setErrorRaw('passwordTooShort');
      return;
    }

    if (password !== confirmPassword) {
      setErrorRaw('passwordsMismatch');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email: email.trim(),
        password,
        fullName: fullName.trim() || undefined,
        companyName: companyName.trim() || undefined,
      });
      localStorage.setItem('smartfeed_show_workspace_onboarding', 'true');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      captureException(err, { form: 'signup', email: email.trim() });
      setErrorRaw(err);
    } finally {
      setIsLoading(false);
    }
  };

  const errorMessage = errorRaw ? getErrorMessage(errorRaw, t) : null;

  return (
    <Card data-testid="signup-card" className={cn('w-full max-w-sm', className)} {...props}>
      <CardHeader>
        <CardTitle className="text-2xl">{t('registerTitle')}</CardTitle>
        <CardDescription>{t('registerDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form data-testid="signup-form" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            {errorMessage && (
              <Alert variant="destructive" data-testid="error-alert" className="py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription data-testid="error-message">{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name">{t('fullNameLabel')}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t('fullNamePlaceholder')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                data-testid="name-input"
                autoComplete="name"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company-name">{t('companyNameLabel')}</Label>
              <Input
                id="company-name"
                type="text"
                placeholder={t('companyNamePlaceholder')}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                data-testid="company-name-input"
                autoComplete="organization"
                disabled={isLoading}
              />
              <p className="text-[0.8rem] text-muted-foreground">{t('companyNameNote')}</p>
            </div>

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
              <p className="text-[0.8rem] text-muted-foreground">{t('emailNote')}</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">{t('passwordLabel')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="password-input"
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
              <p className="text-[0.8rem] text-muted-foreground">{t('passwordNote')}</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirm-password">{t('confirmPasswordLabel')}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="confirm-password-input"
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
              <p className="text-[0.8rem] text-muted-foreground">{t('confirmPasswordNote')}</p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              data-testid="signup-button"
              className="w-full"
            >
              {isLoading ? t('registering') : t('registerButton')}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {t('haveAccount')}{' '}
              <Link
                to="/auth/login"
                data-testid="signin-link"
                className="underline underline-offset-4 text-foreground font-medium hover:text-primary"
              >
                {t('signInLink')}
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
