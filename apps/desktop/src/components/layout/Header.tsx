import { PanelLeft, Menu, Search, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';

export function Header() {
  const { user } = useAuth();
  const { toggleSidebar, toggleMobileSidebar, isCollapsed } = useSidebar();

  return (
    <header
      data-testid="desktop-header"
      className="h-16 border-b border-border bg-card/40 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10 gap-4"
    >
      {/* Left side: Sidebar trigger & status */}
      <div className="flex items-center space-x-3">
        {/* Desktop Sidebar Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl"
          onClick={toggleSidebar}
          title={isCollapsed ? 'Розгорнути меню' : 'Згорнути меню'}
        >
          <PanelLeft className="h-5 w-5 text-foreground" />
        </Button>

        {/* Mobile Menu Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          className="flex md:hidden h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl"
          onClick={toggleMobileSidebar}
          title="Відкрити меню"
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
            <span>Онлайн</span>
          </Badge>
        </div>
      </div>

      {/* Center: Search */}
      <div className="hidden lg:flex items-center max-w-sm flex-1">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Пошук по каталогах і товарах..."
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
}
