import React from 'react';
import { LogOut } from 'lucide-react';
import { UserProfile } from '@smartfeed/shared';
import { Button } from '@/components/ui/button';

interface SidebarUserProfileProps {
  user: UserProfile | null;
  isCollapsed: boolean;
  currentLang: string;
  onLogout: () => void;
}

export const SidebarUserProfile = React.memo(function SidebarUserProfile({
  user,
  isCollapsed,
  currentLang,
  onLogout,
}: SidebarUserProfileProps) {
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

  return (
    <div className="p-3 border-t border-border/80 bg-card/60">
      {!isCollapsed ? (
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold border border-primary/30 shrink-0">
              {getInitials(user?.fullName, user?.email)}
            </div>
            <div className="flex-1 min-w-0">
              <p
                data-testid="sidebar-user-fullname"
                className="text-xs font-semibold text-foreground truncate"
              >
                {user?.fullName || 'User'}
              </p>
              <p
                data-testid="sidebar-user-email"
                className="text-[10px] text-muted-foreground truncate font-mono"
              >
                {user?.email || 'user@smartfeed.studio'}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            data-testid="logout-button"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md shrink-0"
            onClick={onLogout}
            title={currentLang === 'uk' ? 'Вийти' : 'Logout'}
            aria-label={currentLang === 'uk' ? 'Вийти' : 'Logout'}
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold border border-primary/30">
            {getInitials(user?.fullName, user?.email)}
          </div>
          <button
            type="button"
            data-testid="logout-button"
            onClick={onLogout}
            title={currentLang === 'uk' ? 'Вийти' : 'Logout'}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
});
