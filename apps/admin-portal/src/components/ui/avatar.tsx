import * as React from 'react';
import { cn } from '../../lib/utils';

export function Avatar({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted items-center justify-center font-semibold text-xs uppercase',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AvatarFallback({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-secondary text-secondary-foreground font-medium',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
