'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale } = useLanguage();
  const isUk = locale === 'uk';

  useEffect(() => {
    console.error('[Admin Dashboard Error Boundary]', error);
  }, [error]);

  return (
    <div
      data-testid="admin-dashboard-error"
      className="flex h-[70vh] w-full items-center justify-center p-4 animate-in fade-in duration-300"
    >
      <Card className="max-w-md w-full border-border/80 shadow-2xl bg-card">
        <CardHeader className="text-center pb-3">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-3 shadow-inner">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            {isUk ? 'Помилка завантаження розділу' : 'Section Failed to Load'}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            {isUk
              ? 'Сталася помилка при рендерингу даних. Сайдбар та інші розділи залишаються доступними.'
              : 'An unexpected rendering error occurred. The navigation shell remains fully functional.'}
          </CardDescription>
        </CardHeader>

        {error?.message && (
          <CardContent className="pt-0">
            <div className="p-3 bg-muted/40 rounded-lg border border-border/40 text-xs font-mono text-muted-foreground break-all max-h-24 overflow-y-auto">
              {error.message}
            </div>
          </CardContent>
        )}

        <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            className="w-full sm:flex-1 gap-2 text-xs"
            onClick={() => (window.location.href = '/')}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>{isUk ? 'На головну' : 'Dashboard'}</span>
          </Button>
          <Button className="w-full sm:flex-1 gap-2 text-xs shadow-sm" onClick={() => reset()}>
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{isUk ? 'Повторити' : 'Try Again'}</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
