import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PanelLeft, Menu, Search } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useTranslation } from '@/i18n';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { HeaderUserMenu } from '@/components/layout/HeaderUserMenu';
import { CommandSearchDialog } from '@/components/layout/CommandSearchDialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';

const routeTitles: Record<string, { titleUk: string; titleEn: string; testId: string }> = {
  '/': { titleUk: 'Дашборд', titleEn: 'Dashboard', testId: 'dashboard-header-title' },
  '/catalogs': {
    titleUk: 'Каталоги товарів',
    titleEn: 'Product Catalogs',
    testId: 'catalogs-header-title',
  },
  '/suppliers': {
    titleUk: 'Постачальники',
    titleEn: 'Suppliers',
    testId: 'suppliers-header-title',
  },
  '/ai': {
    titleUk: 'AI Асистент контенту',
    titleEn: 'AI Content Assistant',
    testId: 'ai-header-title',
  },
  '/ai-enrichment': {
    titleUk: 'AI Асистент контенту',
    titleEn: 'AI Content Assistant',
    testId: 'ai-header-title',
  },
  '/cloud-sync': {
    titleUk: 'Хмарна синхронізація & Бекап',
    titleEn: 'Cloud Sync & Backups',
    testId: 'cloud-header-title',
  },
  '/plans': {
    titleUk: 'Тарифні плани та підписка',
    titleEn: 'Subscription Plans & Pricing',
    testId: 'plans-header-title',
  },
  '/team': { titleUk: 'Команда', titleEn: 'Team', testId: 'team-header-title' },
  '/profile': {
    titleUk: 'Профіль користувача',
    titleEn: 'User Profile',
    testId: 'profile-header-title',
  },
  '/settings': { titleUk: 'Налаштування', titleEn: 'Settings', testId: 'settings-header-title' },
};

export const Header = React.memo(function Header() {
  const location = useLocation();
  const { toggleSidebar, toggleMobileSidebar, isCollapsed } = useSidebar();
  const { language } = useTranslation();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const isUk = language === 'uk';

  const currentRouteMeta = routeTitles[location.pathname] || {
    titleUk: 'SmartFeed Studio',
    titleEn: 'SmartFeed Studio',
    testId: 'default-header-title',
  };

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

  return (
    <header
      data-testid="desktop-header"
      className="h-13 sm:h-14 border-b border-border/80 bg-background/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 gap-4 shadow-xs"
    >
      {/* Left side: Sidebar Toggle & shadcn New York v4 Breadcrumb */}
      <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
        <Button
          variant="ghost"
          size="sm"
          data-testid="toggle-sidebar-button"
          className="hidden md:flex h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg"
          onClick={toggleSidebar}
          title={
            isCollapsed
              ? isUk
                ? 'Розгорнути меню'
                : 'Expand Sidebar'
              : isUk
                ? 'Згорнути меню'
                : 'Collapse Sidebar'
          }
        >
          <PanelLeft className="h-4 w-4 text-foreground" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex md:hidden h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg"
          onClick={toggleMobileSidebar}
          title={isUk ? 'Відкрити меню' : 'Open Menu'}
        >
          <Menu className="h-4 w-4 text-foreground" />
        </Button>

        <div className="h-4 w-px bg-border/80 hidden sm:block shrink-0" />

        {/* Clean minimalist Breadcrumb */}
        <Breadcrumb className="min-w-0">
          <BreadcrumbList>
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage
                data-testid={currentRouteMeta.testId}
                className="text-sm font-semibold tracking-tight text-foreground truncate max-w-[240px] sm:max-w-none"
              >
                <h1 className="inline text-inherit font-inherit leading-none">
                  {isUk ? currentRouteMeta.titleUk : currentRouteMeta.titleEn}
                </h1>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right side: Global Actions (Search, Lang & Theme Controls) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Minimalist Search Icon Button */}
        <Button
          variant="ghost"
          size="sm"
          data-testid="header-command-search-trigger"
          onClick={() => setIsCommandOpen(true)}
          className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg transition-colors cursor-pointer"
          title={isUk ? 'Швидкий пошук (⌘K)' : 'Quick Search (⌘K)'}
          aria-label={isUk ? 'Пошук' : 'Search'}
        >
          <Search className="size-4" />
        </Button>

        {/* Language & Theme Controls */}
        <LanguageToggle />
        <ThemeToggle />

        {/* User Profile Avatar Dropdown */}
        <HeaderUserMenu />
      </div>

      {/* Global Command Palette Dialog */}
      <CommandSearchDialog isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </header>
  );
});
