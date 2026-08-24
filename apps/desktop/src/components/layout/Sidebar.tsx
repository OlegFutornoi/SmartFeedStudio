import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarUserProfile } from './SidebarUserProfile';
import { SidebarMobileDrawer } from './SidebarMobileDrawer';

export function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isCollapsed, toggleSidebar, isMobileOpen, closeMobileSidebar } = useSidebar();
  const { items } = useNavigation();
  const { language } = useTranslation();

  const currentLang = language || 'uk';

  const handleLogout = useCallback(() => {
    logout();
    navigate('/auth/login', { replace: true });
  }, [logout, navigate]);

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
                data-testid="toggle-sidebar-button"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg"
                onClick={toggleSidebar}
                title="Згорнути меню"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Navigation Links */}
          <nav
            className="space-y-1.5 flex-1 overflow-y-auto overflow-x-hidden py-2"
            data-testid="desktop-sidebar-nav"
          >
            {!isCollapsed && (
              <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
                {currentLang === 'uk' ? 'Меню клієнта' : 'Client Navigation'}
              </div>
            )}
            {items.map((item) => (
              <SidebarNavItem
                key={item.id || item.key}
                item={item}
                isCollapsed={isCollapsed}
                currentLang={currentLang}
              />
            ))}
          </nav>
        </div>

        {/* Collapsed Rail Toggle Button */}
        {isCollapsed && (
          <div className="p-2 border-t border-border/40 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              data-testid="toggle-sidebar-button"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg"
              onClick={toggleSidebar}
              title="Розгорнути меню"
            >
              <PanelLeftOpen className="h-4 w-4 text-primary" />
            </Button>
          </div>
        )}

        {/* User Footer Profile Card */}
        <SidebarUserProfile
          user={user}
          isCollapsed={isCollapsed}
          currentLang={currentLang}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile Drawer / Overlay Sheet */}
      <SidebarMobileDrawer
        isOpen={isMobileOpen}
        items={items}
        user={user}
        currentLang={currentLang}
        onClose={closeMobileSidebar}
        onLogout={handleLogout}
      />
    </>
  );
}
