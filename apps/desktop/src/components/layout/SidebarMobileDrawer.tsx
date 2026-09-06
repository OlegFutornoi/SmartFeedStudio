import React from 'react';
import { createPortal } from 'react-dom';
import { Layers, X, LogOut } from 'lucide-react';
import { NavigationItemDto, UserProfile } from '@smartfeed/shared';
import { Button } from '@/components/ui/button';
import { SidebarNavItem } from './SidebarNavItem';

import { SidebarUpsellSection } from './SidebarUpsellSection';

interface SidebarMobileDrawerProps {
  isOpen: boolean;
  items: NavigationItemDto[];
  upsellItems?: NavigationItemDto[];
  user: UserProfile | null;
  currentLang: string;
  onClose: () => void;
  onLogout: () => void;
}

export const SidebarMobileDrawer = React.memo(function SidebarMobileDrawer({
  isOpen,
  items,
  upsellItems = [],
  user,
  currentLang,
  onClose,
  onLogout,
}: SidebarMobileDrawerProps) {
  if (!isOpen) return null;

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

  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex flex-col justify-between w-72 max-w-[85vw] h-full bg-card border-r border-border p-4 shadow-2xl z-50 animate-in slide-in-from-left duration-300">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                <Layers className="h-5 w-5" />
              </div>
              <span className="font-bold text-foreground text-base">SmartFeed Studio</span>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="space-y-1.5 flex-1 overflow-y-auto py-2">
            {items.map((item) => (
              <SidebarNavItem
                key={item.id || item.key}
                item={item}
                isCollapsed={false}
                currentLang={currentLang}
                onClick={onClose}
              />
            ))}

            <SidebarUpsellSection
              upsellItems={upsellItems}
              isCollapsed={false}
              currentLang={currentLang}
              onItemClick={onClose}
            />
          </nav>
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
            onClick={onLogout}
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            <span>{currentLang === 'uk' ? 'Вийти' : 'Logout'}</span>
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
});
