import { CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TariffPlanDto } from '@smartfeed/shared';

interface CheckoutSuccessStepProps {
  plan: TariffPlanDto;
  planName: string;
  daysCount: number;
  t: (key: string, vars?: Record<string, string | number>) => string;
  onClose: () => void;
}

export function CheckoutSuccessStep({
  plan,
  planName,
  daysCount,
  t,
  onClose,
}: CheckoutSuccessStepProps) {
  return (
    <div className="py-6 flex flex-col items-center justify-center text-center space-y-5 animate-in zoom-in-95 duration-200">
      <div className="size-16 rounded-2xl bg-muted border border-border flex items-center justify-center text-foreground ring-8 ring-muted/50">
        <CheckCircle2 className="size-9" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-xl font-extrabold text-foreground" data-testid="payment-success-title">
          {t('plans.paymentSuccessTitle')}
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm" data-testid="payment-success-desc">
          {t('plans.paymentSuccessDesc', { name: planName, days: daysCount })}
        </p>
      </div>

      <div className="w-full rounded-xl border border-border bg-muted/40 p-3 text-xs flex items-center justify-between">
        <span className="text-muted-foreground">{t('plans.active')}</span>
        <Badge className="bg-primary text-primary-foreground font-mono font-bold">
          {plan.code} — {t('plans.durationFormat', { count: daysCount })}
        </Badge>
      </div>

      <Button
        onClick={onClose}
        size="lg"
        data-testid="start-working-after-payment-btn"
        className="w-full font-bold shadow-lg shadow-emerald-500/10 h-11 text-sm cursor-pointer"
      >
        <Sparkles className="size-4 mr-2" />
        <span>{t('plans.startWorkingBtn')}</span>
      </Button>
    </div>
  );
}
