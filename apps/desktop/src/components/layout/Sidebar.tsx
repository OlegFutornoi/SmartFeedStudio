import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/i18n';
import { useLicense } from '@/hooks/useLicense';
import { Badge } from '@/components/ui/badge';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarUserProfile } from './SidebarUserProfile';
import { SidebarMobileDrawer } from './SidebarMobileDrawer';

export function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isCollapsed, isMobileOpen, closeMobileSidebar } = useSidebar();
  const { items } = useNavigation();
  const { language } = useTranslation();
  const { isExpired } = useLicense();

  const currentLang = language || 'uk';

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/auth/login');
  }, [logout, navigate]);

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        data-testid="desktop-sidebar"
        className={cn(
          'hidden md:flex flex-col justify-between h-screen sticky top-0 border-r border-border bg-card/60 backdrop-blur-xl transition-all duration-300 z-20 select-none shadow-xs',
          isCollapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Top Brand Header */}
          <div className="p-4 border-b border-border/80">
            <div className="flex items-center">
              <button
                type="button"
                data-testid="sidebar-brand-button"
                onClick={() => navigate('/')}
                className="flex items-center space-x-3 w-full overflow-hidden text-left group cursor-pointer"
              >
                <div className="h-9 w-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0 shadow-xs">
                  <Layers className="h-5 w-5" />
                </div>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-foreground flex items-center gap-1.5 whitespace-nowrap">
                      <span>SmartFeed</span>
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1 py-0 h-4 uppercase font-semibold text-primary bg-primary/10 border-primary/20"
                      >
                        Studio
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate font-normal">
                      Catalog Manager
                    </div>
                  </div>
                )}
              </button>
            </div>
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
                isExpired={isExpired}
              />
            ))}
          </nav>
        </div>

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
