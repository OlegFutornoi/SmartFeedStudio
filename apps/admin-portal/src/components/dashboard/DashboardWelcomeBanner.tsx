'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Key } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { UserProfile } from '@smartfeed/shared';

interface DashboardWelcomeBannerProps {
  user: UserProfile | null;
  onOpenPasswordDialog: () => void;
}

export const DashboardWelcomeBanner = React.memo(function DashboardWelcomeBanner({
  user,
  onOpenPasswordDialog,
}: DashboardWelcomeBannerProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/20 backdrop-blur-sm">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Вітаємо, {user?.fullName || 'Адміністратор'}!
          </h1>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            {user?.role || 'SUPER_ADMIN'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Огляд активності користувачів, ліцензій та хмарного сховища SmartFeed Studio
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <Link href="/users">
          <Button className="h-9 gap-1.5 shadow-md shadow-primary/20">
            <Users className="h-4 w-4" />
            <span>Список користувачів</span>
          </Button>
        </Link>
        <Button
          variant="outline"
          className="h-9 gap-1.5 border-border hover:bg-muted/80"
          onClick={onOpenPasswordDialog}
        >
          <Key className="h-4 w-4 text-primary" />
          <span>Змінити пароль</span>
        </Button>
      </div>
    </div>
  );
});
