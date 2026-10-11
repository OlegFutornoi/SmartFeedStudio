import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface UserAvatarCellProps {
  fullName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'md';
  showEmail?: boolean;
  className?: string;
  testId?: string;
}

export function UserAvatarCell({
  fullName,
  email,
  avatarUrl,
  size = 'md',
  showEmail = false,
  className,
  testId = 'user-avatar-cell',
}: UserAvatarCellProps) {
  const displayName = fullName || email?.split('@')[0] || 'User';
  const initials = (
    fullName
      ? fullName
          .trim()
          .split(/\s+/)
          .map((part) => part[0])
          .slice(0, 2)
          .join('')
      : email
        ? email.slice(0, 2)
        : 'US'
  ).toUpperCase();

  const isSm = size === 'sm';

  return (
    <div data-testid={testId} className={cn('flex items-center gap-2 min-w-0', className)}>
      <Avatar
        data-testid="user-avatar"
        className={cn(
          'shrink-0 border border-primary/20 bg-primary/10 text-primary font-semibold',
          isSm ? 'size-6' : 'size-7',
        )}
      >
        {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0 truncate">
        <span
          data-testid="user-avatar-name"
          className={cn(
            'font-medium text-foreground truncate',
            isSm ? 'text-xs max-w-[120px]' : 'text-xs',
          )}
          title={displayName}
        >
          {displayName}
        </span>
        {showEmail && email && (
          <span
            data-testid="user-avatar-email"
            className="text-[11px] text-muted-foreground font-mono truncate"
            title={email}
          >
            {email}
          </span>
        )}
      </div>
    </div>
  );
}
