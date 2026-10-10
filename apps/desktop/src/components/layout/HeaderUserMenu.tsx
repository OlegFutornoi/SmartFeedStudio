import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, BadgeCheck, CreditCard, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const HeaderUserMenu = React.memo(function HeaderUserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language } = useTranslation();
  const isUk = language === 'uk';

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

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/auth/login');
  }, [logout, navigate]);

  const displayName = user?.fullName || (isUk ? 'Користувач' : 'User');
  const displayEmail = user?.email || 'user@smartfeed.studio';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="header-user-trigger"
          className="flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-ring/50 transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ml-1"
          title={displayName}
          aria-label={isUk ? 'Меню профілю' : 'User Profile Menu'}
        >
          <Avatar className="h-8 w-8 rounded-full border border-border shadow-2xs">
            <AvatarImage src={user?.avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs rounded-full">
              {getInitials(user?.fullName, user?.email)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-56 rounded-lg p-1.5 shadow-lg border border-border bg-popover text-popover-foreground z-50"
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2.5 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-full border border-border shrink-0">
              <AvatarImage src={user?.avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs rounded-full">
                {getInitials(user?.fullName, user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-xs leading-tight min-w-0">
              <span className="truncate font-semibold text-foreground">{displayName}</span>
              <span className="truncate text-[11px] text-muted-foreground">{displayEmail}</span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            data-testid="header-profile-link"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 cursor-pointer text-xs"
          >
            <BadgeCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{isUk ? 'Профіль' : 'Profile'}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            data-testid="header-settings-link"
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 cursor-pointer text-xs"
          >
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{isUk ? 'Налаштування' : 'Settings'}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            data-testid="header-plans-link"
            onClick={() => navigate('/plans')}
            className="flex items-center gap-2 cursor-pointer text-xs"
          >
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{isUk ? 'Тарифи та ліцензії' : 'Billing & Plans'}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          data-testid="header-logout-button"
          onClick={handleLogout}
          className="flex items-center gap-2 cursor-pointer text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>{isUk ? 'Вийти з системи' : 'Log out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
