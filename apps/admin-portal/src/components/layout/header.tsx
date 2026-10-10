'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { PanelLeft, Menu, Moon, Sun, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminCommandSearchDialog } from '@/components/layout/AdminCommandSearchDialog';

interface RouteMeta {
  titleUk: string;
  titleEn: string;
  testId: string;
}

const ROUTE_META_MAP: Record<string, RouteMeta> = {
  '/': { titleUk: 'Дашборд', titleEn: 'Dashboard', testId: 'dashboard-header-title' },
  '/users': { titleUk: 'Користувачі', titleEn: 'Users', testId: 'users-header-title' },
  '/licenses': {
    titleUk: 'Видані ліцензії',
    titleEn: 'Issued Customer Licenses',
    testId: 'licenses-header-title',
  },
  '/plans': { titleUk: 'Тарифні плани', titleEn: 'Tariff Plans', testId: 'plans-header-title' },
  '/transactions': {
    titleUk: 'Журнал транзакцій',
    titleEn: 'Payment Transactions',
    testId: 'transactions-header-title',
  },
  '/navigation': {
    titleUk: 'Навігація & Система доступів',
    titleEn: 'Navigation & Access Control',
    testId: 'navigation-header-title',
  },
  '/profile': {
    titleUk: 'Профіль адміністратора',
    titleEn: 'Administrator Profile',
    testId: 'profile-header-title',
  },
  '/settings': {
    titleUk: 'Налаштування платформи',
    titleEn: 'Platform Settings',
    testId: 'settings-header-title',
  },
  '/settings/payments': {
    titleUk: 'Платіжні системи',
    titleEn: 'Payment Gateways',
    testId: 'payments-header-title',
  },
  '/settings/ai': {
    titleUk: 'AI Провайдери',
    titleEn: 'AI Providers',
    testId: 'ai-header-title',
  },
};

export function Header() {
  const pathname = usePathname();
  const { setThemeMode, resolvedMode } = useTheme();
  const { toggleSidebar, toggleMobileSidebar, isCollapsed } = useSidebar();
  const { t, locale } = useLanguage();
  const isUk = locale === 'uk';
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const currentRouteMeta = useMemo(() => {
    if (!pathname) return ROUTE_META_MAP['/'];
    if (ROUTE_META_MAP[pathname]) return ROUTE_META_MAP[pathname];
    // Find closest prefix match
    const matchingPrefix = Object.keys(ROUTE_META_MAP).find(
      (prefix) => prefix !== '/' && pathname.startsWith(prefix),
    );
    return matchingPrefix ? ROUTE_META_MAP[matchingPrefix] : ROUTE_META_MAP['/'];
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setThemeMode(resolvedMode === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="h-14 border-b border-border/80 bg-background/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 gap-4 shadow-xs">
      {/* Left side: Sidebar Toggle & Dynamic Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Desktop Sidebar Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg -ml-1 shrink-0"
          onClick={toggleSidebar}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeft className="h-4 w-4 text-foreground" />
        </Button>

        {/* Mobile Menu Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          className="flex md:hidden h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg shrink-0"
          onClick={toggleMobileSidebar}
          title="Open menu"
        >
          <Menu className="h-4 w-4 text-foreground" />
        </Button>

        <Separator orientation="vertical" className="h-4 mx-1 hidden sm:block shrink-0" />

        {/* Clean minimalist Breadcrumb */}
        <Breadcrumb className="min-w-0">
          <BreadcrumbList>
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage
                data-testid={currentRouteMeta.testId}
                className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[240px] sm:max-w-none"
              >
                <h1 className="inline text-inherit font-inherit leading-none">
                  {isUk ? currentRouteMeta.titleUk : currentRouteMeta.titleEn}
                </h1>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right side: Search Icon, Language & Theme Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Minimalist Search Icon Button */}
        <Button
          variant="ghost"
          size="sm"
          data-testid="admin-command-search-trigger"
          onClick={() => setIsCommandOpen(true)}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg transition-colors cursor-pointer"
          title={isUk ? 'Швидкий пошук (⌘K)' : 'Quick Search (⌘K)'}
          aria-label={isUk ? 'Пошук' : 'Search'}
        >
          <Search className="size-4" />
        </Button>

        {/* Language Switcher */}
        <LanguageToggle />

        {/* Quick Theme Toggle Button */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 border-border hover:bg-muted/80 rounded-lg"
          onClick={toggleTheme}
          title="Toggle theme"
        >
          {resolvedMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      <AdminCommandSearchDialog isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </header>
  );
}
