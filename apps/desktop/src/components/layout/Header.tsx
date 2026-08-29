import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PanelLeft,
  Menu,
  Search,
  User,
  Zap,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useLicense } from '@/hooks/useLicense';
import { useTranslation } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { cn } from '@/lib/utils';

export const Header = React.memo(function Header() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleSidebar, toggleMobileSidebar, isCollapsed } = useSidebar();
  const { license, daysRemaining, isExpired } = useLicense();
  const { language } = useTranslation();
  const isUk = language === 'uk';

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
      className="h-16 border-b border-border bg-card/40 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10 gap-4"
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
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={isUk ? 'Пошук по каталогах і товарах...' : 'Search catalogs and SKUs...'}
            className="w-full bg-secondary/40 border border-border/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Right side: Language, Theme, User badge */}
      <div className="flex items-center gap-2 sm:gap-3">
        <LanguageToggle />
        <ThemeToggle />

        <div className="h-4 w-px bg-border hidden sm:block" />

        <div
          data-testid="user-profile-badge"
          className="flex items-center gap-2 px-2.5 py-1 rounded-xl border border-border/80 text-xs text-muted-foreground bg-secondary/30"
        >
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
            <User className="h-3 w-3" />
          </div>
          <span
            data-testid="user-email"
            className="font-medium text-foreground max-w-[160px] truncate"
          >
            {user?.email || 'user@smartfeed.studio'}
          </span>
        </div>
      </div>
    </header>
  );
});
