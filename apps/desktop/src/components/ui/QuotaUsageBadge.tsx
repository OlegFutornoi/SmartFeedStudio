import { Badge } from '@/components/ui/badge';
import { QuotaItemDto } from '@smartfeed/shared';

interface QuotaUsageBadgeProps {
  quota?: QuotaItemDto | null;
  unit?: string;
  className?: string;
}

export function QuotaUsageBadge({ quota, unit, className = '' }: QuotaUsageBadgeProps) {
  if (!quota) return null;

  if (quota.isUnlimited) {
    return (
      <Badge
        variant="secondary"
        className={`text-[11px] font-mono font-medium text-foreground bg-muted border-border ${className}`}
      >
        {quota.used.toLocaleString()} / ∞ {unit}
      </Badge>
    );
  }

  const isCritical = quota.percentUsed >= 100 || quota.isExceeded;
  const isWarning = quota.percentUsed >= 80 && !isCritical;

  let colorClasses = 'text-foreground bg-muted border-border';
  if (isCritical) {
    colorClasses = 'text-destructive bg-destructive/10 border-destructive/30 font-semibold';
  } else if (isWarning) {
    colorClasses = 'text-foreground bg-muted/80 border-border font-medium';
  }

  return (
    <Badge
      variant="outline"
      className={`text-[11px] font-mono font-semibold transition-all duration-200 ${colorClasses} ${className}`}
    >
      {quota.used.toLocaleString()} / {quota.max.toLocaleString()} {unit}
    </Badge>
  );
}
