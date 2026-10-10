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
  Building2,
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
  Building2,
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
        'flex items-center text-xs font-medium transition-colors group relative rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-ring/40 border',
        isCollapsed
          ? 'justify-center h-8 w-8 mx-auto px-0 border-transparent'
          : 'gap-2.5 mx-1 px-3 h-8',
        isActive
          ? 'bg-muted/70 text-foreground font-semibold border-border/50 shadow-xs'
          : isRestrictedWhenExpired
            ? 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 opacity-75 border-transparent'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border-transparent',
      )}
    >
      {renderItemIcon(
        item.icon,
        cn(
          'h-4 w-4 shrink-0',
          isActive
            ? 'text-primary'
            : isRestrictedWhenExpired
              ? 'text-muted-foreground/50'
              : 'text-muted-foreground/80 group-hover:text-foreground',
        ),
      )}
      {!isCollapsed && (
        <div className="flex items-center justify-between flex-1 min-w-0">
          <span className="truncate">{label}</span>
          {isRestrictedWhenExpired ? (
            <Lock className="size-3 text-muted-foreground shrink-0 ml-1" />
          ) : isPlansLink && isExpired ? (
            <Badge
              variant="default"
              className="text-[9px] px-1.5 py-0 ml-1 bg-primary text-primary-foreground font-semibold shadow-xs"
            >
              {currentLang === 'uk' ? 'Обрати' : 'Select'}
            </Badge>
          ) : null}
        </div>
      )}
    </Link>
  );
});
