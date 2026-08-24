'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarNavItemProps {
  name: string;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}

export const SidebarNavItem = React.memo(function SidebarNavItem({
  name,
  href,
  icon: Icon,
  isActive,
  isCollapsed,
  onClick,
}: SidebarNavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={isCollapsed ? name : undefined}
      className={cn(
        'flex items-center rounded-xl text-sm font-medium transition-all group relative',
        isCollapsed ? 'justify-center h-10 w-10 mx-auto px-0' : 'space-x-3 px-3 py-2.5',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
          isActive
            ? 'text-primary-foreground'
            : 'text-muted-foreground group-hover:text-foreground',
        )}
      />
      {!isCollapsed && <span className="truncate">{name}</span>}
    </Link>
  );
});
