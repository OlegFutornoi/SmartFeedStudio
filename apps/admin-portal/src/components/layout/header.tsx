'use client';

import React, { useState, useEffect } from 'react';
import { PanelLeft, Menu, Moon, Sun, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminCommandSearchDialog } from '@/components/layout/AdminCommandSearchDialog';

export function Header() {
  const { setThemeMode, resolvedMode } = useTheme();
  const { toggleSidebar, toggleMobileSidebar, isCollapsed } = useSidebar();
  const { t } = useLanguage();
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
      {/* Left side: Sidebar Toggle */}
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

      {/* Right side: Actions & Controls */}
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
          {resolvedMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      <AdminCommandSearchDialog isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </header>
  );
}
