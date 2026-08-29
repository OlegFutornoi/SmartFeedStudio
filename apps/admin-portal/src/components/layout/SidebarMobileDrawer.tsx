'use client';

import React from 'react';
import { LucideIcon, ShieldCheck, X, KeyRound, LogOut, Settings } from 'lucide-react';
import { UserProfile } from '@smartfeed/shared';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { SidebarNavItem } from './SidebarNavItem';
import { useLanguage } from '../../contexts/LanguageContext';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  testId?: string;
}

interface SidebarMobileDrawerProps {
  isOpen: boolean;
  mainNavigation: NavItem[];
  settingsNavigation: NavItem[];
  pathname: string;
  user: UserProfile | null;
  onClose: () => void;
  onOpenPasswordDialog: () => void;
  onLogout: () => void;
}

export const SidebarMobileDrawer = React.memo(function SidebarMobileDrawer({
  isOpen,
  mainNavigation,
  settingsNavigation,
  pathname,
  user,
  onClose,
  onOpenPasswordDialog,
  onLogout,
}: SidebarMobileDrawerProps) {
  const { locale, t } = useLanguage();
  const isUk = locale === 'uk';

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 md:hidden flex">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <aside className="relative flex flex-col justify-between w-72 max-w-[80vw] h-full bg-card border-r border-border p-4 shadow-2xl z-10">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">SmartFeed</div>
              <div className="text-[11px] text-muted-foreground">Admin Portal</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 py-4 overflow-y-auto space-y-4">
          {/* Main menu */}
          <nav className="space-y-1.5">
            <div className="px-3 pb-1 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
              {isUk ? 'Головне меню' : 'Main Menu'}
            </div>
            {mainNavigation.map((item) => {
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <SidebarNavItem
                  key={item.href}
                  name={item.name}
                  href={item.href}
                  icon={item.icon}
                  isActive={isActive}
                  isCollapsed={false}
                  dataTestId={item.testId}
                  onClick={onClose}
                />
              );
            })}
          </nav>

          {/* Settings navigation */}
          <nav className="space-y-1.5 pt-3 border-t border-border/50">
            {settingsNavigation.map((subItem) => {
              const isActive =
                subItem.href === '/settings'
                  ? pathname === '/settings'
                  : pathname.startsWith(subItem.href);
              return (
                <SidebarNavItem
                  key={subItem.href}
                  name={subItem.name}
                  href={subItem.href}
                  icon={subItem.icon}
                  isActive={isActive}
                  isCollapsed={false}
                  badge={subItem.badge}
                  dataTestId={subItem.testId}
                  onClick={onClose}
                />
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <Avatar className="h-9 w-9 border border-border shrink-0">
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                {getInitials(user?.fullName, user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {user?.fullName || 'Адміністратор'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate font-mono">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onClose();
                onOpenPasswordDialog();
              }}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-md"
              title={t('common', 'change_password')}
              aria-label={t('common', 'change_password')}
            >
              <KeyRound className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
              title={t('common', 'logout')}
              aria-label={t('common', 'logout')}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
});
