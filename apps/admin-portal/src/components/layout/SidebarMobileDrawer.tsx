'use client';

import React from 'react';
import { LucideIcon, ShieldCheck, X } from 'lucide-react';
import { UserProfile } from '@smartfeed/shared';
import { Button } from '@/components/ui/button';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarUserProfile } from './SidebarUserProfile';
import { useLanguage } from '@/contexts/LanguageContext';

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

        {/* Footer User Profile */}
        <SidebarUserProfile
          user={user}
          isCollapsed={false}
          onOpenPasswordDialog={() => {
            onClose();
            onOpenPasswordDialog();
          }}
          onLogout={onLogout}
        />
      </aside>
    </div>
  );
});
