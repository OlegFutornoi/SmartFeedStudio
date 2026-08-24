'use client';

import React from 'react';
import Link from 'next/link';
import { PanelLeft, Menu, Moon, Sun, Palette, Search, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LanguageToggle } from '../ui/language-toggle';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useLanguage } from '../../contexts/LanguageContext';

export function Header() {
  const { user } = useAuth();
  const { setThemeMode, resolvedMode } = useTheme();
  const { toggleSidebar, toggleMobileSidebar, isCollapsed } = useSidebar();
  const { t } = useLanguage();

  const toggleTheme = () => {
    setThemeMode(resolvedMode === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="h-16 border-b border-border bg-card/40 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10 gap-4">
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
          <span className="text-sm font-semibold text-foreground hidden sm:inline">
            SmartFeed Studio
          </span>
          <Badge
            variant="outline"
            className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t('common', 'system_online')}</span>
          </Badge>
        </div>
      </div>

      {/* Center: Search input */}
      <div className="hidden lg:flex items-center max-w-sm flex-1">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('common', 'search_placeholder')}
            className="w-full bg-secondary/40 border border-border/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
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
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold border border-primary/30 group-hover:scale-105 transition-transform">
            {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'AD'}
          </div>
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
    </header>
  );
}
