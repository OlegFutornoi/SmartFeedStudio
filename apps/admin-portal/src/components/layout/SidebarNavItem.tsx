'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
        'flex items-center rounded-md font-medium text-sm transition-colors group relative outline-none focus-visible:ring-1 focus-visible:ring-ring',
        isSubItem ? 'h-7 text-xs' : 'h-8 text-sm',
        isCollapsed
          ? 'justify-center h-8 w-8 mx-auto px-0'
          : isSubItem
            ? 'gap-2 pl-6 pr-2.5'
            : 'gap-2.5 px-2.5',
        isActive
          ? 'bg-muted text-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
      )}
    >
      <Icon
        className={cn(
          'shrink-0',
          isSubItem ? 'h-3.5 w-3.5' : 'h-4 w-4',
          isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
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
