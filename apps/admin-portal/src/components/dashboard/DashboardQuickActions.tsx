'use client';

import React from 'react';
import Link from 'next/link';
import { Users, KeyRound, Key, Sparkles, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useLanguage } from '../../contexts/LanguageContext';

interface DashboardQuickActionsProps {
  totalUsers: number;
  onOpenPasswordDialog: () => void;
}

export const DashboardQuickActions = React.memo(function DashboardQuickActions({
  totalUsers,
  onOpenPasswordDialog,
}: DashboardQuickActionsProps) {
  const { t } = useLanguage();

  return (
    <div data-testid="dashboard-quick-actions-panel" className="md:col-span-2 space-y-4">
      <Card className="border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle
            data-testid="quick-actions-title"
            className="text-base font-semibold flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>{t('dashboard', 'quick_actions')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          <Link href="/users" className="block">
            <Button
              data-testid="action-btn-users"
              variant="outline"
              className="w-full justify-start text-xs h-9 border-border hover:bg-muted/80"
            >
              <Users className="h-4 w-4 mr-2 text-primary" />
              <span>{t('dashboard', 'view_all_users', { count: totalUsers })}</span>
            </Button>
          </Link>
          <Link href="/licenses" className="block">
            <Button
              data-testid="action-btn-licenses"
              variant="outline"
              className="w-full justify-start text-xs h-9 border-border hover:bg-muted/80"
            >
              <KeyRound className="h-4 w-4 mr-2 text-emerald-400" />
              <span>{t('dashboard', 'manage_licenses')}</span>
            </Button>
          </Link>
          <Button
            data-testid="action-btn-change-pwd"
            variant="outline"
            className="w-full justify-start text-xs h-9 border-border hover:bg-muted/80"
            onClick={onOpenPasswordDialog}
          >
            <Key className="h-4 w-4 mr-2 text-amber-400" />
            <span>{t('dashboard', 'change_my_password')}</span>
          </Button>
        </CardContent>
      </Card>

      <Card
        data-testid="dashboard-security-notice"
        className="border-border/80 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm p-4"
      >
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4
              data-testid="security-notice-title"
              className="text-xs font-semibold text-foreground"
            >
              {t('dashboard', 'security_notice_title')}
            </h4>
            <p
              data-testid="security-notice-desc"
              className="text-[11px] text-muted-foreground mt-0.5"
            >
              {t('dashboard', 'security_notice_desc')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
});
