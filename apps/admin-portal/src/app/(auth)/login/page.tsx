'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { translateError } from '../../../lib/errors';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { LanguageToggle } from '../../../components/ui/language-toggle';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Layers, ShieldCheck, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const { login, user, isLoading } = useAuth();
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
    } catch (err: unknown) {
      setErrorMessage(translateError(err, locale));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-background px-4 overflow-hidden selection:bg-primary/30">
      {/* Top language switch */}
      <div className="absolute top-6 right-6 z-20">
        <LanguageToggle />
      </div>

      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-[32rem] h-[32rem] bg-primary/20 rounded-full blur-[140px] pointer-events-none opacity-80 animate-pulse duration-1000" />
      <div className="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none opacity-80" />

      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--muted-foreground)/0.08)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />

      <div className="relative w-full max-w-md space-y-6 z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground shadow-xl shadow-primary/30 ring-1 ring-white/20 mb-2 transition-transform hover:scale-105 duration-300">
            <Layers className="h-7 w-7 drop-shadow" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t('auth', 'title')}
          </h1>
          <p className="text-sm text-muted-foreground/90 font-medium">{t('auth', 'subtitle')}</p>
        </div>

        {/* Login Card */}
        <Card className="relative overflow-hidden border-border/80 bg-card/75 backdrop-blur-2xl shadow-2xl shadow-black/40 ring-1 ring-white/10">
          {/* Top accent gradient border */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

          <CardHeader className="space-y-3 pb-4">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center space-x-1.5 text-xs text-primary font-medium bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{t('auth', 'security_badge')}</span>
              </div>
            </div>

            <div>
              <CardTitle
                data-testid="login-card-title"
                className="text-2xl font-bold tracking-tight text-foreground"
              >
                {t('auth', 'form_title')}
              </CardTitle>
              <CardDescription className="text-sm text-foreground/80 dark:text-zinc-300 mt-1.5 leading-normal">
                {t('auth', 'form_subtitle')}
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-1">
              {errorMessage && (
                <div
                  data-testid="login-error-alert"
                  className="flex items-center space-x-2 rounded-lg bg-destructive/15 p-3 text-sm text-destructive border border-destructive/30 animate-in fade-in"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t('auth', 'email_label')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth', 'email_placeholder')}
                    className="pl-9 bg-background/60 border-border/80 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t('auth', 'password_label')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('auth', 'password_placeholder')}
                    className="pl-9 bg-background/60 border-border/80 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2 pb-6">
              <Button
                type="submit"
                className="w-full h-11 font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.99] transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth', 'logging_in')}
                  </>
                ) : (
                  t('auth', 'submit_button')
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Security badge */}
        <p className="text-center text-xs text-muted-foreground/80 font-medium">
          SmartFeed Enterprise Cloud &bull; Encrypted Session Security &bull; v1.2.1
        </p>
      </div>
    </div>
  );
}
