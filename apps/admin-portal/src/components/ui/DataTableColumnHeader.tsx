'use client';

import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataTableColumnHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  isSorted?: 'asc' | 'desc' | false;
  onToggleSort?: () => void;
  className?: string;
}

export const DataTableColumnHeader: React.FC<DataTableColumnHeaderProps> = ({
  title,
  isSorted = false,
  onToggleSort,
  className,
  ...props
}) => {
  if (!onToggleSort) {
    return (
      <span className={cn('text-xs font-semibold text-muted-foreground', className)}>{title}</span>
    );
  }

  return (
    <div
      onClick={onToggleSort}
      className={cn(
        'group inline-flex items-center gap-1.5 cursor-pointer select-none text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors',
        isSorted && 'text-foreground',
        className,
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggleSort();
        }
      }}
      {...props}
    >
      <span>{title}</span>
      {isSorted === 'asc' ? (
        <ArrowUp className="size-3 text-primary shrink-0" />
      ) : isSorted === 'desc' ? (
        <ArrowDown className="size-3 text-primary shrink-0" />
      ) : (
        <ArrowUpDown className="size-3 opacity-0 group-hover:opacity-70 transition-opacity shrink-0" />
      )}
    </div>
  );
};
