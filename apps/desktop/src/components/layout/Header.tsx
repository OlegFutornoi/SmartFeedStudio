import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PanelLeft, Menu, Search, Zap, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useLicense } from '@/hooks/useLicense';
import { useTranslation } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { CommandSearchDialog } from './CommandSearchDialog';
import { cn } from '@/lib/utils';

export const Header = React.memo(function Header() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleSidebar, toggleMobileSidebar, isCollapsed } = useSidebar();
  const { license, daysRemaining, isExpired } = useLicense();
  const { language } = useTranslation();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const isUk = language === 'uk';

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

  const planName =
    license?.tariffPlan?.nameUk && isUk
      ? license.tariffPlan.nameUk
      : license?.tariffPlan?.nameEn || license?.planType || 'STARTER';

  const planCode = license?.planType || 'STARTER';
  const isUnlimited =
    planCode === 'ENTERPRISE' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  return (
    <header
      data-testid="desktop-header"
      className="h-13 sm:h-14 border-b border-border/60 bg-card/60 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 gap-4 shadow-xs"
    >
      {/* Left side: Single Sidebar Toggle & Active Subscription Status */}
      <div className="flex items-center space-x-3">
        {/* Unified Desktop Sidebar Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          data-testid="toggle-sidebar-button"
          className="hidden md:flex h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl"
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
          <PanelLeft className="h-5 w-5 text-foreground" />
        </Button>

        {/* Mobile Menu Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          className="flex md:hidden h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl"
          onClick={toggleMobileSidebar}
          title={isUk ? 'Відкрити меню' : 'Open Menu'}
        >
          <Menu className="h-5 w-5 text-foreground" />
        </Button>

        <div className="h-4 w-px bg-border hidden sm:block" />

        {/* Active Subscription Plan & Days Remaining Widget */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="header-active-plan-badge"
            onClick={() => navigate('/plans')}
            title={isUk ? 'Перейти до тарифних планів' : 'Manage subscription plans'}
            className={cn(
              'group flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-xs',
              isExpired
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 hover:bg-amber-500/20'
                : planCode === 'PRO' || planCode === 'ENTERPRISE'
                  ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 hover:border-primary/50'
                  : 'bg-secondary/70 border-border hover:bg-secondary text-foreground',
            )}
          >
            {isExpired ? (
              <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
            ) : planCode === 'PRO' || planCode === 'GROWTH' ? (
              <Zap className="size-3.5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
            ) : planCode === 'ENTERPRISE' ? (
              <Sparkles className="size-3.5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
            ) : (
              <ShieldCheck className="size-3.5 text-muted-foreground shrink-0" />
            )}

            <span className="font-bold">{planName}</span>

            <span className="text-muted-foreground font-normal">•</span>

            <span
              className={cn(
                'text-[11px]',
                isExpired ? 'text-amber-500 font-bold' : 'text-muted-foreground',
              )}
            >
              {isExpired
                ? isUk
                  ? 'Вичерпано'
                  : 'Expired'
                : isUnlimited
                  ? isUk
                    ? 'Безліміт'
                    : 'Unlimited'
                  : isUk
                    ? `${daysRemaining} дн.`
                    : `${daysRemaining} days`}
            </span>
          </button>

          {/* System Online Status Indicator */}
          <Badge
            variant="outline"
            className="text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hidden lg:inline-flex items-center gap-1 px-2 py-0.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isUk ? 'Онлайн' : 'Online'}</span>
          </Badge>
        </div>
      </div>

      {/* Center: Search */}
      <div className="hidden lg:flex items-center max-w-sm flex-1">
        <button
          type="button"
          data-testid="header-command-search-trigger"
          onClick={() => setIsCommandOpen(true)}
          className="w-full bg-secondary/40 hover:bg-secondary/70 border border-border/80 rounded-xl pl-3 pr-2 py-1.5 text-xs text-muted-foreground flex items-center justify-between transition-colors cursor-pointer text-left group"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="truncate">
              {isUk ? 'Швидкий пошук по системі...' : 'Search catalogs and actions...'}
            </span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground bg-muted border border-border rounded-md shadow-xs">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right side: Language & Theme Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      {/* Global Command Palette Dialog */}
      <CommandSearchDialog isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </header>
  );
});
