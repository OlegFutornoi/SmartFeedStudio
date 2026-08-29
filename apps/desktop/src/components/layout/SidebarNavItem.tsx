import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  CreditCard,
  Lock,
} from 'lucide-react';
import { NavigationItemDto } from '@smartfeed/shared';
import { cn } from '@/lib/utils';
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
  CreditCard,
};

function renderItemIcon(iconName: string, className?: string) {
  const IconComponent = ICON_MAP[iconName] || LayoutDashboard;
  return <IconComponent className={className || 'h-4 w-4'} />;
}

interface SidebarNavItemProps {
  item: NavigationItemDto;
  isCollapsed: boolean;
  currentLang: string;
  isExpired?: boolean;
  onClick?: () => void;
}

export const SidebarNavItem = React.memo(function SidebarNavItem({
  item,
  isCollapsed,
  currentLang,
  isExpired = false,
  onClick,
}: SidebarNavItemProps) {
  const location = useLocation();
  const label = currentLang === 'uk' ? item.labelUk : item.labelEn;
  const isActive =
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);

  const isRestrictedWhenExpired = isExpired && !['/plans', '/settings'].includes(item.path);
  const isPlansLink = item.path === '/plans';

  return (
    <Link
      to={item.path}
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      data-testid={`nav-item-${item.key}`}
      className={cn(
        'flex items-center rounded-xl text-sm font-medium transition-all group relative',
        isCollapsed ? 'justify-center h-10 w-10 mx-auto px-0' : 'space-x-3 px-3 py-2.5',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold'
          : isRestrictedWhenExpired
            ? 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 opacity-75'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
      )}
    >
      {renderItemIcon(
        item.icon,
        cn(
          'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
          isActive
            ? 'text-primary-foreground'
            : isRestrictedWhenExpired
              ? 'text-muted-foreground/50'
              : 'text-muted-foreground group-hover:text-foreground',
        ),
      )}
      {!isCollapsed && (
        <div className="flex items-center justify-between flex-1 min-w-0">
          <span className="truncate">{label}</span>
          {isRestrictedWhenExpired ? (
            <Lock className="size-3 text-amber-500/70 shrink-0 ml-1" />
          ) : isPlansLink && isExpired ? (
            <Badge
              variant="default"
              className="text-[9px] px-1.5 py-0 ml-1 bg-amber-600 text-white font-semibold animate-pulse shadow-xs"
            >
              {currentLang === 'uk' ? 'Обрати' : 'Select'}
            </Badge>
          ) : (
            item.requiredPlan && (
              <Badge
                variant="outline"
                className="text-[9px] px-1 py-0 ml-1 border-primary/30 text-primary"
              >
                {item.requiredPlan}
              </Badge>
            )
          )}
        </div>
      )}
    </Link>
  );
});
