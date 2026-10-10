import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  User,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation, getErrorMessage } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { captureException } from '@/lib/sentry';

interface SignupFormProps extends React.ComponentPropsWithoutRef<'div'> {
  onOpenLegal?: (type: 'terms' | 'privacy') => void;
}

export function SignupForm({ className, onOpenLegal, ...props }: SignupFormProps) {
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [errorRaw, setErrorRaw] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { t } = useTranslation(['auth', 'common', 'errors']);
  const navigate = useNavigate();

  const isPasswordValid = password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorRaw(null);

    if (!email.trim() || !password) {
      setErrorRaw('fillAllFields');
      return;
    }

    if (!isPasswordValid) {
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
    <div
      data-testid="signup-card"
      className={cn('flex flex-col gap-3 w-full', className)}
      {...props}
    >
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {t('registerTitle')}
        </h1>
        <p className="text-xs text-muted-foreground">{t('registerDescription')}</p>
      </div>

      <form data-testid="signup-form" onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        {errorMessage && (
          <Alert variant="destructive" data-testid="error-alert" className="py-2">
            <AlertCircle className="h-3.5 w-3.5" />
            <AlertDescription data-testid="error-message" className="text-xs">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Full Name & Company Name Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="grid gap-1">
            <Label htmlFor="name" className="text-xs font-medium">
              {t('fullNameLabel')}
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder={t('fullNamePlaceholder')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                data-testid="name-input"
                autoComplete="name"
                disabled={isLoading}
                className="pl-8 h-8.5 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="grid gap-1">
            <Label htmlFor="company-name" className="text-xs font-medium">
              {t('companyNameLabel')}
            </Label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="company-name"
                type="text"
                placeholder={t('companyNamePlaceholder')}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                data-testid="company-name-input"
                autoComplete="organization"
                disabled={isLoading}
                className="pl-8 h-8.5 text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Email Field */}
        <div className="grid gap-1">
          <Label htmlFor="email" className="text-xs font-medium">
            {t('emailLabel')}
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
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
              className="pl-8 h-8.5 text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Password & Confirm Password Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="grid gap-1">
            <Label htmlFor="password" className="text-xs font-medium">
              {t('passwordLabel')}
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="password-input"
                required
                autoComplete="new-password"
                disabled={isLoading}
                className="pl-8 pr-8 h-8.5 text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="grid gap-1">
            <Label htmlFor="confirm-password" className="text-xs font-medium">
              {t('confirmPasswordLabel')}
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="confirm-password-input"
                required
                autoComplete="new-password"
                disabled={isLoading}
                className="pl-8 pr-8 h-8.5 text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Password Hint */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <CheckCircle2
            className={cn(
              'h-3.5 w-3.5 transition-colors',
              isPasswordValid ? 'text-emerald-500' : 'text-muted-foreground/60',
            )}
          />
          <span>{t('passwordNote')}</span>
        </div>

        {/* Terms Agreement Checkbox with Interactive Modal Triggers */}
        <label className="flex items-start gap-2 cursor-pointer text-[11px] text-muted-foreground select-none leading-tight">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
          />
          <span>
            {t('termsAgreement')}{' '}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onOpenLegal?.('terms');
              }}
              className="underline hover:text-foreground font-medium transition-colors"
            >
              {t('termsOfService')}
            </button>{' '}
            {t('and')}{' '}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onOpenLegal?.('privacy');
              }}
              className="underline hover:text-foreground font-medium transition-colors"
            >
              {t('privacyPolicy')}
            </button>
            .
          </span>
        </label>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading || !agreedToTerms}
          data-testid="signup-button"
          className="w-full h-9 text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5 mt-0.5"
        >
          {isLoading ? (
            <span>{t('registering')}</span>
          ) : (
            <>
              <span>{t('registerButton')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>

        {/* Sign In CTA Link */}
        <div className="rounded-lg border border-border/60 bg-muted/30 py-2 px-3 text-center text-xs">
          <span className="text-muted-foreground">{t('haveAccount')} </span>
          <Link
            to="/auth/login"
            data-testid="signin-link"
            className="font-semibold text-primary hover:underline ml-1 inline-flex items-center gap-1"
          >
            <span>{t('signInLink')}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </form>
    </div>
  );
}
