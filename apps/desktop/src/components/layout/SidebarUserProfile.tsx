import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Building2, MoreVertical, BadgeCheck, CreditCard } from 'lucide-react';
import { UserProfile } from '@smartfeed/shared';
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
    <div className="p-2 mt-auto border-t border-border/40">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-testid="sidebar-user-trigger"
            className={`w-full flex items-center gap-2 p-1.5 rounded-md transition-colors text-left outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-muted/70 data-[state=open]:bg-muted/80 ${
              isCollapsed ? 'justify-center p-1.5' : ''
            }`}
            title={isCollapsed ? displayName : undefined}
          >
            <Avatar className="h-7 w-7 rounded-md border border-border shrink-0">
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
                    className="text-xs font-medium text-foreground truncate leading-tight"
                  >
                    {displayName}
                  </p>
                  {user?.organization && (
                    <p
                      data-testid="sidebar-user-organization"
                      className="text-[10px] text-primary/90 font-medium truncate flex items-center gap-1 leading-tight"
                    >
                      <Building2 className="size-2.5 shrink-0" />
                      <span className="truncate">{user.organization.name}</span>
                    </p>
                  )}
                  <p
                    data-testid="sidebar-user-email user-email"
                    className="text-[10px] text-muted-foreground truncate font-mono leading-tight"
                  >
                    {displayEmail}
                  </p>
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
                <span className="truncate text-[10px] text-muted-foreground font-mono">
                  {displayEmail}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 cursor-pointer text-xs"
            >
              <BadgeCheck className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{isUk ? 'Обліковий запис' : 'Account'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
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
