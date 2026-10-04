import { Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CheckoutResponseDto } from '@smartfeed/shared';
import { SandboxSimulationBlock } from '@/components/plans/SandboxSimulationBlock';

interface CheckoutProcessingStepProps {
  checkoutData: CheckoutResponseDto | null;
  price: number;
  isUk: boolean;
  t: (key: string) => string;
  onOpenGateway: () => void;
  onSimulate: (status: 'Approved' | 'Declined') => void;
  onBackToReview: () => void;
}

export function CheckoutProcessingStep({
  checkoutData,
  price,
  isUk,
  t,
  onOpenGateway,
  onSimulate,
  onBackToReview,
}: CheckoutProcessingStepProps) {
  return (
    <div className="py-8 flex flex-col items-center justify-center text-center space-y-5 animate-in fade-in duration-200">
      <div className="relative">
        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
          <Loader2 className="size-8 animate-spin" />
        </div>
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-base font-bold text-foreground" data-testid="payment-processing-title">
          {t('plans.paymentProcessingTitle')}
        </h3>
        <p className="text-xs text-muted-foreground">{t('plans.paymentProcessingDesc')}</p>
      </div>

      {checkoutData && (
        <div className="w-full rounded-xl border border-border bg-muted/40 p-3 text-xs flex items-center justify-between font-mono">
          <span className="text-muted-foreground">{checkoutData.orderReference}</span>
          <span className="font-bold text-foreground">{price.toLocaleString()} грн</span>
        </div>
      )}

      <div className="w-full space-y-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenGateway}
          className="w-full text-xs font-semibold gap-1.5 h-9"
          data-testid="reopen-wayforpay-btn"
        >
          <ExternalLink className="size-3.5" />
          <span>{t('plans.reopenWayForPay')}</span>
        </Button>

        <SandboxSimulationBlock
          isUk={isUk}
          t={t}
          isDisabled={false}
          successTestId="processing-simulate-success-btn"
          declineTestId="processing-simulate-decline-btn"
          onSimulate={onSimulate}
          compact
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToReview}
          className="w-full text-xs text-muted-foreground hover:text-foreground h-8 cursor-pointer"
        >
          <span>{isUk ? 'Повернутися до замовлення' : 'Back to order'}</span>
        </Button>
      </div>
    </div>
  );
}
