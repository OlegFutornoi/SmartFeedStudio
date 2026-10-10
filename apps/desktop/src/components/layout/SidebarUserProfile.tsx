import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MoreVertical, BadgeCheck, CreditCard, Settings } from 'lucide-react';
import { UserProfile } from '@smartfeed/shared';
import { cn } from '@/lib/utils';
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
  const navigate = useNavigate();
  const isUk = currentLang === 'uk';

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

  const displayName = user?.fullName || (isUk ? 'Користувач' : 'User');
  const displayEmail = user?.email || 'user@smartfeed.studio';

  return (
    <div
      className={cn(
        'py-2 mt-auto border-t border-border/40',
        isCollapsed ? 'px-0 flex justify-center' : 'px-2',
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-testid="sidebar-user-trigger"
            className={cn(
              'flex items-center rounded-md transition-colors text-left outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-muted/70 data-[state=open]:bg-muted/80 cursor-pointer',
              isCollapsed ? 'justify-center h-8 w-8 mx-auto p-0' : 'w-full gap-2.5 p-1.5',
            )}
            title={isCollapsed ? displayName : undefined}
          >
            <Avatar className="h-8 w-8 rounded-md border border-border shrink-0">
              <AvatarImage src={user?.avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs rounded-md">
                {getInitials(user?.fullName, user?.email)}
              </AvatarFallback>
            </Avatar>

            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p
                    data-testid="sidebar-user-fullname"
                    className="text-xs font-semibold text-foreground truncate leading-tight"
                  >
                    {displayName}
                  </p>
                  <p
                    data-testid="user-email"
                    className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5"
                  >
                    <span data-testid="sidebar-user-email">{displayEmail}</span>
                  </p>
                  {user?.organization && (
                    <span data-testid="sidebar-user-organization" className="hidden">
                      {user.organization.name}
                    </span>
                  )}
                </div>
                <MoreVertical className="h-4 w-4 text-muted-foreground shrink-0 ml-auto" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side={isCollapsed ? 'right' : 'top'}
          align="end"
          sideOffset={8}
          className="w-56 rounded-lg p-1.5 shadow-lg border border-border bg-popover text-popover-foreground z-50"
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2.5 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg border border-border shrink-0">
                <AvatarImage src={user?.avatarUrl || undefined} alt={displayName} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs rounded-lg">
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
              data-testid="sidebar-profile-link"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 cursor-pointer text-xs"
            >
              <BadgeCheck className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{isUk ? 'Профіль' : 'Profile'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              data-testid="sidebar-settings-link"
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 cursor-pointer text-xs"
            >
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{isUk ? 'Налаштування' : 'Settings'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              data-testid="sidebar-plans-link"
              onClick={() => navigate('/plans')}
              className="flex items-center gap-2 cursor-pointer text-xs"
            >
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{isUk ? 'Тарифи та ліцензії' : 'Billing & Plans'}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            data-testid="logout-button"
            onClick={onLogout}
            className="flex items-center gap-2 cursor-pointer text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{isUk ? 'Вийти з системи' : 'Log out'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});
