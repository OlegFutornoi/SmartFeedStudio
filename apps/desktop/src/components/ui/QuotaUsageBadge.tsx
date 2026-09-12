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
        className={`text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 border-emerald-500/20 ${className}`}
      >
        {quota.used.toLocaleString()} / ∞ {unit}
      </Badge>
    );
  }

  const isCritical = quota.percentUsed >= 100 || quota.isExceeded;
  const isWarning = quota.percentUsed >= 80 && !isCritical;

  let colorClasses = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (isCritical) {
    colorClasses = 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30 font-semibold';
  } else if (isWarning) {
    colorClasses = 'text-amber-400 bg-amber-500/10 border-amber-500/25';
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
