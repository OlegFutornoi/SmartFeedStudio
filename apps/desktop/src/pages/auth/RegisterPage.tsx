import { SignupForm } from '@/components/signup-form';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';

export function RegisterPage() {
  return (
    <div
      data-testid="register-page"
      className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background text-foreground"
    >
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  );
}
