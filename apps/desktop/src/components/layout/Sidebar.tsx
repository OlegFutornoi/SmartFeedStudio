import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  Cloud,
  Settings,
  BarChart3,
  Database,
  KeyRound,
  Users,
  Shield,
  Bell,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Layers,
  Sparkles,
  Cloud,
  Settings,
  BarChart3,
  Database,
  KeyRound,
  Users,
  Shield,
  Bell,
};

function renderItemIcon(iconName: string, className?: string) {
  const IconComponent = ICON_MAP[iconName] || LayoutDashboard;
  return <IconComponent className={className || 'h-4 w-4'} />;
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isCollapsed, toggleSidebar, isMobileOpen, closeMobileSidebar } = useSidebar();
  const { items } = useNavigation();
  const { language } = useTranslation();

  const currentLang = language || 'uk';

  const handleLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
  };

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'US';
  };

  const renderNavItems = () => (
    <nav
      className="space-y-1.5 flex-1 overflow-y-auto overflow-x-hidden py-2"
      data-testid="desktop-sidebar-nav"
    >
      {!isCollapsed && (
        <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
          {currentLang === 'uk' ? 'Меню клієнта' : 'Client Navigation'}
        </div>
      )}
      {items.map((item) => {
        const label = currentLang === 'uk' ? item.labelUk : item.labelEn;
        const isActive =
          item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);

        return (
          <Link
            key={item.id || item.key}
            to={item.path}
            onClick={closeMobileSidebar}
            title={isCollapsed ? label : undefined}
            className={cn(
              'flex items-center rounded-xl text-sm font-medium transition-all group relative',
              isCollapsed ? 'justify-center h-10 w-10 mx-auto px-0' : 'space-x-3 px-3 py-2.5',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            {renderItemIcon(
              item.icon,
              cn(
                'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                isActive
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground group-hover:text-foreground',
              ),
            )}
            {!isCollapsed && (
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span className="truncate">{label}</span>
                {item.requiredPlan && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 py-0 ml-1 border-primary/30 text-primary"
                  >
                    {item.requiredPlan}
                  </Badge>
                )}
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <aside
        data-testid="desktop-sidebar"
        className={cn(
          'hidden md:flex flex-col justify-between h-screen sticky top-0 border-r border-border bg-card/50 backdrop-blur-xl transition-all duration-300 z-20 select-none',
          isCollapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        <div className="p-3 flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div
            className={cn(
              'flex items-center mb-6 pb-2 border-b border-border/40',
              isCollapsed ? 'justify-center pt-2' : 'justify-between px-2 pt-2',
            )}
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                <Layers className="h-5 w-5" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-foreground tracking-tight text-base truncate">
                      SmartFeed
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 border-primary/40 text-primary"
                    >
                      Studio
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">Catalog Manager</p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg"
                onClick={toggleSidebar}
                title="Згорнути меню"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          {renderNavItems()}
        </div>

        {/* Collapsed Rail Toggle Button */}
        {isCollapsed && (
          <div className="p-2 border-t border-border/40 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg"
              onClick={toggleSidebar}
              title="Розгорнути меню"
            >
              <PanelLeftOpen className="h-4 w-4 text-primary" />
            </Button>
          </div>
        )}

        {/* User Footer Profile Card */}
        <div className="p-3 border-t border-border/80 bg-card/60">
          {!isCollapsed ? (
            <>
              <div className="flex items-center space-x-3 mb-3 px-1">
                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold border border-primary/30 shrink-0">
                  {getInitials(user?.fullName, user?.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {user?.fullName || 'User'}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate font-mono">
                    {user?.email || 'user@smartfeed.studio'}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                data-testid="logout-button"
                className="w-full h-8 text-xs justify-center border-border hover:bg-destructive/15 hover:text-destructive hover:border-destructive/30"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                <span>{currentLang === 'uk' ? 'Вийти' : 'Logout'}</span>
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold border border-primary/30">
                {getInitials(user?.fullName, user?.email)}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title={currentLang === 'uk' ? 'Вийти' : 'Logout'}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Drawer / Overlay Sheet */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeMobileSidebar}
          />
          <div className="relative flex flex-col justify-between w-72 max-w-[85vw] h-full bg-card border-r border-border p-4 shadow-2xl z-50 animate-in slide-in-from-left duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                    <Layers className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-foreground text-base">SmartFeed Studio</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={closeMobileSidebar}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {renderNavItems()}
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold border border-primary/30">
                  {getInitials(user?.fullName, user?.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {user?.fullName || 'User'}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate font-mono">
                    {user?.email || 'user@smartfeed.studio'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                <span>{currentLang === 'uk' ? 'Вийти' : 'Logout'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
