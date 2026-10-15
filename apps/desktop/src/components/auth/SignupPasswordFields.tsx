import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SignupPasswordFieldsProps {
  password: string;
  setPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (val: boolean) => void;
  isPasswordValid: boolean;
  isLoading: boolean;
  t: (key: string) => string;
}

export function SignupPasswordFields({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  isPasswordValid,
  isLoading,
  t,
}: SignupPasswordFieldsProps) {
  return (
    <>
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
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
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

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CheckCircle2
          className={cn(
            'h-3.5 w-3.5 transition-colors',
            isPasswordValid ? 'text-emerald-500' : 'text-muted-foreground/60',
          )}
        />
        <span>{t('passwordNote')}</span>
      </div>
    </>
  );
}
