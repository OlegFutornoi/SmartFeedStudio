import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

interface TransactionStatusBadgeProps {
  status: string;
  isUk: boolean;
}

export function TransactionStatusBadge({ status, isUk }: TransactionStatusBadgeProps) {
  switch (status) {
    case 'APPROVED':
      return (
        <Badge
          variant="outline"
          data-testid="transaction-status-approved"
          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1 text-[11px] font-medium"
        >
          <CheckCircle2 className="size-3" />
          <span>{isUk ? 'Оплачено' : 'Approved'}</span>
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge
          variant="outline"
          data-testid="transaction-status-pending"
          className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1 text-[11px] font-medium"
        >
          <Clock className="size-3" />
          <span>{isUk ? 'Очікує' : 'Pending'}</span>
        </Badge>
      );
    case 'DECLINED':
      return (
        <Badge
          variant="destructive"
          className="bg-destructive/10 text-destructive border-destructive/30 gap-1 text-[11px]"
        >
          <XCircle className="size-3" />
          <span>{isUk ? 'Відхилено' : 'Declined'}</span>
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function TransactionPlanBadge({ planCode }: { planCode: string }) {
  const isPro = planCode === 'PRO';
  const isEnterprise = planCode === 'ENTERPRISE';

  return (
    <Badge
      variant="outline"
      className={`text-[10px] uppercase font-bold tracking-wider ${
        isEnterprise
          ? 'bg-primary/20 text-primary border-primary/40'
          : isPro
            ? 'bg-primary/10 text-primary border-primary/30'
            : 'bg-muted text-muted-foreground'
      }`}
    >
      {planCode}
    </Badge>
  );
}
