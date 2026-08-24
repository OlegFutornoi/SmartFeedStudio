'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Layers, ShieldCheck, Lock, Mail, AlertCircle, Loader2, KeyRound } from 'lucide-react';

export default function AdminLoginPage() {
  const { login, user, isLoading } = useAuth();
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
    } catch (err: any) {
      setErrorMessage(err?.message || 'Невірний email або пароль');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDefaultCredentials = () => {
    setEmail('admin@gmail.com');
    setPassword('admin@gmail.com');
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-background px-4 overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px] pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/30 mb-2">
            <Layers className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            SmartFeed Studio
          </h1>
          <p className="text-sm text-muted-foreground">
            Панель адміністрування та керування ліцензіями
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border/80 bg-card/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Вхід для адміністратора</CardTitle>
              <div className="flex items-center space-x-1 text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Захищений вхід</span>
              </div>
            </div>
            <CardDescription>
              Введіть ваш корпоративний email та пароль для авторизації
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="flex items-center space-x-2 rounded-lg bg-destructive/15 p-3 text-sm text-destructive border border-destructive/30 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@gmail.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Пароль</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Button
                type="submit"
                className="w-full h-10 font-semibold shadow-md shadow-primary/25 transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Перевірка доступу...
                  </>
                ) : (
                  'Увійти до панелі'
                )}
              </Button>

              {/* Quick default credential helper */}
              <div className="w-full pt-2 border-t border-border/50 text-center">
                <button
                  type="button"
                  onClick={fillDefaultCredentials}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center mx-auto space-x-1.5"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Заповнити тестові дані (admin@gmail.com)</span>
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Security badge */}
        <p className="text-center text-xs text-muted-foreground">
          SmartFeed Enterprise Cloud &bull; Encrypted Session Security &bull; v1.1.1
        </p>
      </div>
    </div>
  );
}
