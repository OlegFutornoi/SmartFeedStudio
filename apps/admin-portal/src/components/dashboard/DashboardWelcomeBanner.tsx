'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Key } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { UserProfile } from '@smartfeed/shared';
import { useLanguage } from '../../contexts/LanguageContext';

interface DashboardWelcomeBannerProps {
  user: UserProfile | null;
  onOpenPasswordDialog: () => void;
}

export const DashboardWelcomeBanner = React.memo(function DashboardWelcomeBanner({
  user,
  onOpenPasswordDialog,
}: DashboardWelcomeBannerProps) {
  const { t } = useLanguage();
  const displayName = user?.fullName || t('common', 'administrator');

  return (
    <div
      data-testid="dashboard-welcome-banner"
      className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/20 backdrop-blur-sm"
    >
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <h1
            data-testid="dashboard-welcome-title"
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            {t('dashboard', 'welcome_title', { name: displayName })}
          </h1>
          <Badge
            data-testid="dashboard-user-role"
            variant="outline"
            className="bg-primary/10 text-primary border-primary/30"
          >
            {user?.role || 'SUPER_ADMIN'}
          </Badge>
        </div>
        <p data-testid="dashboard-welcome-subtitle" className="text-sm text-muted-foreground">
          {t('dashboard', 'welcome_subtitle')}
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <Link href="/users">
          <Button
            data-testid="dashboard-btn-users"
            className="h-9 gap-1.5 shadow-md shadow-primary/20"
          >
            <Users className="h-4 w-4" />
            <span>{t('dashboard', 'users_list')}</span>
          </Button>
        </Link>
        <Button
          data-testid="dashboard-btn-change-pwd"
          variant="outline"
          className="h-9 gap-1.5 border-border hover:bg-muted/80"
          onClick={onOpenPasswordDialog}
        >
          <Key className="h-4 w-4 text-primary" />
          <span>{t('dashboard', 'change_password')}</span>
        </Button>
      </div>
    </div>
  );
});
