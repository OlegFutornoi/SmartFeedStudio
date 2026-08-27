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
  ChevronDown,
  User,
  Layers,
  WalletCards,
  Sparkles,
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
  const isUk = locale === 'uk';

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);

  // Main navigation (Top section)
  const mainNavigation = useMemo(
    () => [
      {
        name: isUk ? 'Дашборд' : 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
        testId: 'nav-item-dashboard',
      },
      {
        name: isUk ? 'Користувачі' : 'Users',
        href: '/users',
        icon: Users,
        testId: 'nav-item-users',
      },
      {
        name: isUk ? 'Тарифи' : 'Tariff Plans',
        href: '/plans',
        icon: Layers,
        testId: 'nav-item-plans',
      },
      {
        name: isUk ? 'Ліцензії' : 'Licenses',
        href: '/licenses',
        icon: KeyRound,
        testId: 'nav-item-licenses',
      },
      {
        name: isUk ? 'Навігація меню' : 'Navigation Menu',
        href: '/navigation',
        icon: Compass,
        testId: 'nav-item-navigation',
      },
    ],
    [isUk],
  );

  // Settings sub-navigation (Bottom section)
  const settingsNavigation = useMemo(
    () => [
      {
        name: isUk ? 'Профіль' : 'Profile',
        href: '/settings',
        icon: User,
        testId: 'nav-item-settings-profile',
      },
      {
        name: isUk ? 'Тарифи' : 'Tariff Plans',
        href: '/plans',
        icon: Layers,
        testId: 'nav-item-settings-plans',
      },
      {
        name: isUk ? 'Платіжні системи' : 'Payment Gateways',
        href: '/settings/payments',
        icon: WalletCards,
        badge: isUk ? 'Скоро' : 'Soon',
        testId: 'nav-item-settings-payments',
      },
      {
        name: isUk ? 'Налаштування AI' : 'AI Settings',
        href: '/settings/ai',
        icon: Sparkles,
        badge: isUk ? 'Скоро' : 'Soon',
        testId: 'nav-item-settings-ai',
      },
    ],
    [isUk],
  );

  const isSettingsActive = useMemo(
    () => pathname.startsWith('/settings') || pathname.startsWith('/plans'),
    [pathname],
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

        {/* Scrollable Navigation Area */}
        <div className="flex-1 px-3 py-2 overflow-y-auto overflow-x-hidden flex flex-col justify-between">
          {/* Main Top Navigation */}
          <nav className="space-y-1 py-1">
            {!isCollapsed && (
              <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
                {isUk ? 'Головне меню' : 'Main Menu'}
              </div>
            )}
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
                  isCollapsed={isCollapsed}
                  dataTestId={item.testId}
                  onClick={closeMobileSidebar}
                />
              );
            })}
          </nav>

          {/* Bottom Settings Submenu Navigation */}
          <div className="mt-auto pt-3 border-t border-border/50">
            {isCollapsed ? (
              // Collapsed mode: display settings icons directly
              <div className="space-y-1">
                {settingsNavigation.map((subItem) => {
                  const isSubActive =
                    subItem.href === '/settings'
                      ? pathname === '/settings'
                      : pathname.startsWith(subItem.href);
                  return (
                    <SidebarNavItem
                      key={subItem.href}
                      name={subItem.name}
                      href={subItem.href}
                      icon={subItem.icon}
                      isActive={isSubActive}
                      isCollapsed={true}
                      badge={subItem.badge}
                      dataTestId={subItem.testId}
                      onClick={closeMobileSidebar}
                    />
                  );
                })}
              </div>
            ) : (
              // Expanded mode: collapsible Settings group with styled submenu
              <div className="space-y-1">
                <button
                  type="button"
                  data-testid="nav-group-settings-toggle"
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors',
                    isSettingsActive
                      ? 'text-foreground bg-muted/40 font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="h-3.5 w-3.5 text-primary" />
                    <span>{isUk ? 'Налаштування' : 'Settings'}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform duration-200 text-muted-foreground',
                      settingsOpen && 'rotate-180',
                    )}
                  />
                </button>

                {settingsOpen && (
                  <div className="space-y-1 pt-1 pb-1 animate-in fade-in-50 duration-200">
                    {settingsNavigation.map((subItem) => {
                      const isSubActive =
                        subItem.href === '/settings'
                          ? pathname === '/settings'
                          : pathname.startsWith(subItem.href);
                      return (
                        <SidebarNavItem
                          key={subItem.href}
                          name={subItem.name}
                          href={subItem.href}
                          icon={subItem.icon}
                          isActive={isSubActive}
                          isCollapsed={false}
                          isSubItem={true}
                          badge={subItem.badge}
                          dataTestId={subItem.testId}
                          onClick={closeMobileSidebar}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
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
        mainNavigation={mainNavigation}
        settingsNavigation={settingsNavigation}
        pathname={pathname}
        user={user}
        onClose={closeMobileSidebar}
        onOpenPasswordDialog={handleOpenPasswordDialog}
        onLogout={logout}
      />

      {/* Password change dialog */}
      <ChangePasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
    </>
  );
}
