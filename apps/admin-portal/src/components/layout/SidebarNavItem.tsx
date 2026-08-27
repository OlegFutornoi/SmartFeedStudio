'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';

interface SidebarNavItemProps {
  name: string;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
  isSubItem?: boolean;
  badge?: string;
  dataTestId?: string;
}

export const SidebarNavItem = React.memo(function SidebarNavItem({
  name,
  href,
  icon: Icon,
  isActive,
  isCollapsed,
  onClick,
  isSubItem = false,
  badge,
  dataTestId,
}: SidebarNavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={isCollapsed ? name : undefined}
      data-testid={dataTestId}
      className={cn(
        'flex items-center rounded-xl font-medium transition-all group relative',
        isSubItem ? 'text-xs py-2' : 'text-sm py-2.5',
        isCollapsed
          ? 'justify-center h-10 w-10 mx-auto px-0'
          : isSubItem
            ? 'space-x-2.5 pl-6 pr-3'
            : 'space-x-3 px-3',
        isActive
          ? isSubItem
            ? 'bg-primary/15 text-primary font-semibold border-l-2 border-primary'
            : 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
      )}
    >
      <Icon
        className={cn(
          'shrink-0 transition-transform group-hover:scale-110',
          isSubItem ? 'h-3.5 w-3.5' : 'h-4 w-4',
          isActive
            ? isSubItem
              ? 'text-primary'
              : 'text-primary-foreground'
            : 'text-muted-foreground group-hover:text-foreground',
        )}
      />
      {!isCollapsed && (
        <div className="flex-1 flex items-center justify-between min-w-0">
          <span className="truncate">{name}</span>
          {badge && (
            <Badge
              variant="outline"
              className="text-[9px] px-1 py-0 h-3.5 uppercase font-medium bg-muted/60 text-muted-foreground border-border/50 shrink-0 ml-1.5"
            >
              {badge}
            </Badge>
          )}
        </div>
      )}
    </Link>
  );
});
