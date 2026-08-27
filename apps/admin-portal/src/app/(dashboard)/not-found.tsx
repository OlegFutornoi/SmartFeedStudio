'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

export default function DashboardNotFound() {
  const { locale } = useLanguage();
  const isUk = locale === 'uk';

  return (
    <div
      data-testid="admin-dashboard-not-found"
      className="flex h-[70vh] w-full items-center justify-center p-4 animate-in fade-in duration-300"
    >
      <Card className="max-w-md w-full border-border/80 shadow-2xl bg-card text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-muted border border-border/60 flex items-center justify-center text-muted-foreground mb-3">
            <Search className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            {isUk ? 'Сторінку не знайдено' : 'Page Not Found'}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1.5">
            {isUk
              ? 'Запитаний розділ не існує або був переміщений. Перевірте правильність URL адреси.'
              : 'The requested section does not exist or has been moved. Check the URL address.'}
          </CardDescription>
        </CardHeader>

        <CardFooter className="flex justify-center pt-2">
          <Link href="/">
            <Button className="gap-2 text-xs">
              <Home className="h-4 w-4" />
              <span>{isUk ? 'Повернутися на головну' : 'Return to Dashboard'}</span>
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
