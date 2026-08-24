'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  KeyRound,
  Settings,
  ShieldCheck,
  Compass,
  PanelLeftClose,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarUserProfile } from './SidebarUserProfile';
import { SidebarMobileDrawer } from './SidebarMobileDrawer';

const ChangePasswordDialog = dynamic(
  () =>
    import('../profile/change-password-dialog').then((m) => ({
      default: m.ChangePasswordDialog,
    })),
  { ssr: false },
);

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isCollapsed, toggleSidebar, isMobileOpen, closeMobileSidebar } = useSidebar();
  const { locale } = useLanguage();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const navigation = useMemo(
    () => [
      { name: locale === 'uk' ? 'Дашборд' : 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: locale === 'uk' ? 'Користувачі' : 'Users', href: '/users', icon: Users },
      { name: locale === 'uk' ? 'Ліцензії' : 'Licenses', href: '/licenses', icon: KeyRound },
      {
        name: locale === 'uk' ? 'Навігація меню' : 'Navigation Menu',
        href: '/navigation',
        icon: Compass,
      },
      { name: locale === 'uk' ? 'Налаштування' : 'Settings', href: '/settings', icon: Settings },
    ],
    [locale],
  );

  const handleOpenPasswordDialog = useCallback(() => {
    setPasswordDialogOpen(true);
  }, []);

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col justify-between h-screen sticky top-0 border-r border-border bg-card/50 backdrop-blur-xl transition-all duration-300 z-20 select-none',
          isCollapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        {/* Top brand header */}
        <div className="p-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 overflow-hidden group">
              <div className="h-9 w-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0 shadow-sm shadow-primary/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              {!isCollapsed && (
                <div className="truncate">
                  <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <span>SmartFeed</span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 uppercase">
                      Admin
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">Management</div>
                </div>
              )}
            </Link>

            {/* Sidebar toggle button in header */}
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                onClick={toggleSidebar}
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex-1 px-3 py-2 overflow-hidden flex flex-col">
          <nav className="space-y-1.5 flex-1 overflow-y-auto overflow-x-hidden py-2">
            {!isCollapsed && (
              <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
                {locale === 'uk' ? 'Головне меню' : 'Main Menu'}
              </div>
            )}
            {navigation.map((item) => {
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <SidebarNavItem
                  key={item.href}
                  name={item.name}
                  href={item.href}
                  icon={item.icon}
                  isActive={isActive}
                  isCollapsed={isCollapsed}
                  onClick={closeMobileSidebar}
                />
              );
            })}
          </nav>
        </div>

        {/* Footer profile & actions */}
        <SidebarUserProfile
          user={user}
          isCollapsed={isCollapsed}
          onOpenPasswordDialog={handleOpenPasswordDialog}
          onLogout={logout}
          onToggleSidebar={toggleSidebar}
        />
      </aside>

      {/* Mobile Drawer Sidebar */}
      <SidebarMobileDrawer
        isOpen={isMobileOpen}
        navigation={navigation}
        pathname={pathname}
        user={user}
        onClose={closeMobileSidebar}
        onOpenPasswordDialog={handleOpenPasswordDialog}
        onLogout={logout}
      />

      {/* Profile Change Password Dialog */}
      <ChangePasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
    </>
  );
}
