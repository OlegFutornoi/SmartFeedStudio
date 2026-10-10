import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation, getErrorMessage } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { captureException } from '@/lib/sentry';

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorRaw, setErrorRaw] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { t } = useTranslation(['auth', 'common', 'errors']);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorRaw(null);

    if (!email.trim() || !password) {
      setErrorRaw('fillAllFields');
      return;
    }

    setIsLoading(true);

    try {
      await login({ email: email.trim(), password });
      navigate('/', { replace: true });
    } catch (err: unknown) {
      captureException(err, { form: 'login', email: email.trim() });
      setErrorRaw(err);
    } finally {
      setIsLoading(false);
    }
  };

  const errorMessage = errorRaw ? getErrorMessage(errorRaw, t) : null;

  return (
    <div
      data-testid="login-card"
      className={cn('flex flex-col gap-4 w-full', className)}
      {...props}
    >
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {t('loginTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">{t('loginDescription')}</p>
      </div>

      <form data-testid="login-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errorMessage && (
          <Alert variant="destructive" data-testid="error-alert" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription data-testid="error-message">{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Email Field with Icon */}
        <div className="grid gap-1.5">
          <Label htmlFor="email" className="text-xs font-medium">
            {t('emailLabel')}
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
              className="pl-9 h-9.5 text-sm"
            />
          </div>
        </div>

        {/* Password Field with Icon & Eye Toggle */}
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-medium">
              {t('passwordLabel')}
            </Label>
            <Link
              to="/auth/forgot-password"
              data-testid="forgot-password-link"
              className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              {t('forgotPassword')}
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="password-input"
              required
              autoComplete="current-password"
              disabled={isLoading}
              className="pl-9 pr-10 h-9.5 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-muted-foreground select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span>{t('rememberMe')}</span>
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          data-testid="login-button"
          className="w-full h-9.5 text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 mt-1"
        >
          {isLoading ? (
            <span>{t('loggingIn')}</span>
          ) : (
            <>
              <span>{t('loginButton')}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        {/* Sign Up Redirect CTA */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-center text-xs">
          <span className="text-muted-foreground">{t('noAccount')} </span>
          <Link
            to="/auth/register"
            data-testid="register-link"
            className="font-semibold text-primary hover:underline ml-1 inline-flex items-center gap-1"
          >
            <span>{t('signUpLink')}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </form>
    </div>
  );
}
