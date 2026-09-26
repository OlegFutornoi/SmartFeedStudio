'use client';

import React from 'react';
import { User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { UserProfile } from '@smartfeed/shared';
import { useLanguage } from '../../contexts/LanguageContext';

interface ProfileInfoCardProps {
  user: UserProfile | null;
}

export const ProfileInfoCard = React.memo(function ProfileInfoCard({ user }: ProfileInfoCardProps) {
  const { t } = useLanguage();

  return (
    <Card
      data-testid="profile-info-card"
      className="border-border/80 bg-card/60 backdrop-blur-sm shadow-md"
    >
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{t('settings', 'profile_card_title')}</CardTitle>
            <CardDescription>{t('settings', 'profile_card_desc')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t('settings', 'full_name')}</Label>
          <div data-testid="profile-name" className="font-semibold text-foreground text-sm">
            {user?.fullName || 'Super Administrator'}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t('settings', 'email')}</Label>
          <div data-testid="profile-email" className="font-mono text-foreground text-sm">
            {user?.email || 'admin@gmail.com'}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t('settings', 'role')}</Label>
          <div>
            <Badge
              data-testid="profile-role"
              variant="outline"
              className="bg-primary/10 text-primary border-primary/30"
            >
              {user?.role === 'SUPER_ADMIN'
                ? t('users', 'role_super_admin')
                : user?.role === 'ADMIN'
                  ? t('users', 'role_admin')
                  : t('users', 'role_user')}
            </Badge>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t('settings', 'user_id')}</Label>
          <div className="font-mono text-xs text-muted-foreground break-all">{user?.id || '—'}</div>
        </div>
      </CardContent>
    </Card>
  );
});
