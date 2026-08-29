'use client';

import React from 'react';
import { KeyRound, LogOut, PanelLeftOpen } from 'lucide-react';
import { UserProfile } from '@smartfeed/shared';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { useLanguage } from '../../contexts/LanguageContext';

interface SidebarUserProfileProps {
  user: UserProfile | null;
  isCollapsed: boolean;
  onOpenPasswordDialog: () => void;
  onLogout: () => void;
}

export const SidebarUserProfile = React.memo(function SidebarUserProfile({
  user,
  isCollapsed,
  onOpenPasswordDialog,
  onLogout,
}: SidebarUserProfileProps) {
  const { locale, t } = useLanguage();

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'AD';
  };

  return (
    <div className="p-3 border-t border-border/60 bg-muted/20">
      {!isCollapsed ? (
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <Avatar className="h-8 w-8 border border-border shrink-0">
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                {getInitials(user?.fullName, user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {user?.fullName || (locale === 'uk' ? 'Адміністратор' : 'Administrator')}
              </p>
              <p className="text-[10px] text-muted-foreground truncate font-mono">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              data-testid="sidebar-change-password-btn"
              onClick={onOpenPasswordDialog}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md"
              title={t('common', 'change_password')}
              aria-label={t('common', 'change_password')}
            >
              <KeyRound className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              data-testid="sidebar-logout-btn"
              onClick={onLogout}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
              title={t('common', 'logout')}
              aria-label={t('common', 'logout')}
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-2">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarFallback className="bg-primary/20 text-primary font-bold text-[10px]">
              {getInitials(user?.fullName, user?.email)}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="sm"
            data-testid="sidebar-logout-btn"
            onClick={onLogout}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
            title={t('common', 'logout')}
            aria-label={t('common', 'logout')}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
});
