'use client';

import React, { useMemo, useCallback, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { getLucideIcon } from '../navigation/constants';
import { Badge } from '../ui/badge';
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
  const { items: dynamicNavItems } = useNavigation();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const isUk = locale === 'uk';

  const TEST_ID_MAP: Record<string, string> = {
    admin_dashboard: 'nav-item-dashboard',
    admin_users: 'nav-item-users',
    admin_plans: 'nav-item-plans',
    admin_licenses: 'nav-item-licenses',
    admin_transactions: 'nav-item-transactions',
    admin_payment_settings: 'nav-item-payments',
    admin_navigation: 'nav-item-navigation',
  };

  const DEFAULT_MAIN_NAV = [
    {
      key: 'admin_dashboard',
      labelUk: 'Дашборд',
      labelEn: 'Dashboard',
      path: '/',
      icon: 'LayoutDashboard',
    },
    { key: 'admin_users', labelUk: 'Користувачі', labelEn: 'Users', path: '/users', icon: 'Users' },
    {
      key: 'admin_transactions',
      labelUk: 'Транзакції',
      labelEn: 'Transactions',
      path: '/transactions',
      icon: 'Receipt',
    },
    {
      key: 'admin_licenses',
      labelUk: 'Ліцензії',
      labelEn: 'Licenses',
      path: '/licenses',
      icon: 'KeyRound',
    },
    {
      key: 'admin_plans',
      labelUk: 'Тарифи',
      labelEn: 'Tariff Plans',
      path: '/plans',
      icon: 'Layers',
    },
    {
      key: 'admin_payment_settings',
      labelUk: 'Платіжні системи',
      labelEn: 'Payment Gateways',
      path: '/settings/payments',
      icon: 'WalletCards',
    },
    {
      key: 'admin_navigation',
      labelUk: 'Навігація меню',
      labelEn: 'Navigation Menu',
      path: '/navigation',
      icon: 'Compass',
    },
  ];

  const mainNavigation = useMemo(() => {
    const sourceItems =
      !dynamicNavItems || dynamicNavItems.length === 0 ? DEFAULT_MAIN_NAV : dynamicNavItems;

    return sourceItems.map((item) => ({
      key: item.key,
      name: isUk ? item.labelUk : item.labelEn,
      href: item.path,
      icon: getLucideIcon(item.icon),
      testId: TEST_ID_MAP[item.key] ?? `nav-item-${item.key.replace(/^admin_/, '')}`,
    }));
  }, [dynamicNavItems, isUk]);

  const settingsNavigation = useMemo(
    () => [
      {
        name: isUk ? 'Налаштування' : 'Settings',
        href: '/settings',
        icon: Settings,
        testId: 'nav-item-settings-profile',
      },
    ],
    [isUk],
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
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 w-full overflow-hidden group">
              <div className="h-9 w-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0 shadow-sm shadow-primary/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-foreground flex items-center gap-1.5 whitespace-nowrap">
                    <span>SmartFeed</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1 py-0 h-4 uppercase font-semibold text-primary border-primary/40"
                    >
                      Admin
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate font-normal">
                    Management Console
                  </div>
                </div>
              )}
            </Link>
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
                  key={item.key || item.href}
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

          {/* Bottom Settings Navigation */}
          <div className="mt-auto pt-3 border-t border-border/50 space-y-1">
            <SidebarNavItem
              name={isUk ? 'Налаштування' : 'Settings'}
              href="/settings"
              icon={Settings}
              isActive={pathname === '/settings'}
              isCollapsed={isCollapsed}
              dataTestId="nav-item-settings-profile"
              onClick={closeMobileSidebar}
            />
          </div>
        </div>

        {/* Footer profile & actions */}
        <SidebarUserProfile
          user={user}
          isCollapsed={isCollapsed}
          onOpenPasswordDialog={handleOpenPasswordDialog}
          onLogout={logout}
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
