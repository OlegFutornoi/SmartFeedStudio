'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PanelLeft, Menu, Moon, Sun, Palette, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminCommandSearchDialog } from './AdminCommandSearchDialog';

export function Header() {
  const { user } = useAuth();
  const { setThemeMode, resolvedMode } = useTheme();
  const { toggleSidebar, toggleMobileSidebar, isCollapsed } = useSidebar();
  const { t, locale } = useLanguage();
  const [isCommandOpen, setIsCommandOpen] = useState(false);

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
    <header className="h-14 border-b border-border/60 bg-card/60 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 gap-4 shadow-xs">
      {/* Left side: Sidebar Toggle & System Status */}
      <div className="flex items-center space-x-3">
        {/* Desktop Sidebar Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl"
          onClick={toggleSidebar}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeft className="h-5 w-5 text-foreground" />
        </Button>

        {/* Mobile Menu Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          className="flex md:hidden h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl"
          onClick={toggleMobileSidebar}
          title="Open menu"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </Button>

        <div className="h-4 w-px bg-border hidden sm:block" />

        <div className="flex items-center space-x-2">
          <Badge
            variant="secondary"
            className="text-xs font-semibold px-2.5 py-0.5 flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20"
          >
            <ShieldCheck className="size-3.5" />
            <span>{locale === 'uk' ? 'Панель Адміністратора' : 'Admin Console'}</span>
          </Badge>

          <Badge
            variant="outline"
            className="text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1 px-2 py-0.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t('common', 'system_online')}</span>
          </Badge>
        </div>
      </div>

      {/* Center: Command Search trigger */}
      <div className="hidden lg:flex items-center max-w-sm flex-1">
        <button
          type="button"
          data-testid="admin-command-search-trigger"
          onClick={() => setIsCommandOpen(true)}
          className="w-full bg-secondary/40 hover:bg-secondary/70 border border-border/80 rounded-xl pl-3 pr-2 py-1.5 text-xs text-muted-foreground flex items-center justify-between transition-colors cursor-pointer text-left group"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="truncate">{t('common', 'search_placeholder')}</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground bg-muted border border-border rounded-md shadow-xs">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right side: Actions & User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Switcher */}
        <LanguageToggle />

        {/* Quick Theme Toggle Button */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0 border-border hover:bg-muted/80 rounded-lg"
          onClick={toggleTheme}
          title="Toggle theme"
        >
          {resolvedMode === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-primary" />
          )}
        </Button>

        {/* Link to Settings */}
        <Link href="/settings">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 border-border hover:bg-muted/80 rounded-lg"
            title={t('common', 'theme_settings')}
            aria-label={t('common', 'theme_settings')}
          >
            <Palette className="h-4 w-4 text-foreground" />
          </Button>
        </Link>

        <div className="h-4 w-px bg-border hidden sm:block" />

        {/* User Profile */}
        <Link href="/settings" className="flex items-center gap-2.5 group">
          <Avatar className="w-8 h-8 border border-primary/30 group-hover:scale-105 transition-transform shrink-0">
            <AvatarImage src={user?.avatarUrl || undefined} alt={user?.fullName || 'Admin'} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
              {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'AD'}
            </AvatarFallback>
          </Avatar>
          <div className="text-left hidden xl:block">
            <div className="text-xs font-semibold text-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
              {user?.fullName || t('common', 'administrator')}
              <ShieldCheck className="h-3 w-3 text-primary" />
            </div>
            <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[130px]">
              {user?.email || 'admin@smartfeed.studio'}
            </div>
          </div>
        </Link>
      </div>

      <AdminCommandSearchDialog isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </header>
  );
}
