'use client';

import React from 'react';
import Link from 'next/link';
import { Users, KeyRound, Key, Sparkles, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface DashboardQuickActionsProps {
  totalUsers: number;
  onOpenPasswordDialog: () => void;
}

export const DashboardQuickActions = React.memo(function DashboardQuickActions({
  totalUsers,
  onOpenPasswordDialog,
}: DashboardQuickActionsProps) {
  return (
    <div className="md:col-span-2 space-y-4">
      <Card className="border-border/80 bg-card/60 backdrop-blur-sm shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Швидкі дії</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          <Link href="/users" className="block">
            <Button
              variant="outline"
              className="w-full justify-start text-xs h-9 border-border hover:bg-muted/80"
            >
              <Users className="h-4 w-4 mr-2 text-primary" />
              <span>Переглянути всіх ({totalUsers})</span>
            </Button>
          </Link>
          <Link href="/licenses" className="block">
            <Button
              variant="outline"
              className="w-full justify-start text-xs h-9 border-border hover:bg-muted/80"
            >
              <KeyRound className="h-4 w-4 mr-2 text-emerald-400" />
              <span>Керування ліцензіями</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            className="w-full justify-start text-xs h-9 border-border hover:bg-muted/80"
            onClick={onOpenPasswordDialog}
          >
            <Key className="h-4 w-4 mr-2 text-amber-400" />
            <span>Змінити мій пароль</span>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm p-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-foreground">Безпека адмін-панелі</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Використовується JWT з ротацією токенів та bcrypt хешування паролів.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
});
