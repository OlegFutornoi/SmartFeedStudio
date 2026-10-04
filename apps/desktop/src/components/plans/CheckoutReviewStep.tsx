import {
  CreditCard,
  RefreshCw,
  Clock,
  Layers,
  Zap,
  ShieldCheck,
  Lock,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TariffPlanDto, CheckoutResponseDto } from '@smartfeed/shared';
import { SandboxSimulationBlock } from '@/components/plans/SandboxSimulationBlock';

interface CheckoutReviewStepProps {
  plan: TariffPlanDto;
  planName: string;
  price: number;
  daysCount: number;
  isYearly: boolean;
  isLoadingInvoice: boolean;
  errorMessage: string | null;
  checkoutData: CheckoutResponseDto | null;
  isUk: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
  onInitInvoice: () => void;
  onOpenGateway: () => void;
  onSimulate: (status: 'Approved' | 'Declined') => void;
}

export function CheckoutReviewStep({
  plan,
  planName,
  price,
  daysCount,
  isYearly,
  isLoadingInvoice,
  errorMessage,
  checkoutData,
  isUk,
  t,
  onInitInvoice,
  onOpenGateway,
  onSimulate,
}: CheckoutReviewStepProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
          <CreditCard className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground" data-testid="checkout-modal-title">
            {t('plans.checkoutModalTitle')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('plans.checkoutModalSubtitle')}</p>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-400 dark:text-red-300 flex items-center justify-between gap-2 animate-in fade-in">
          <span className="font-medium leading-relaxed break-words">{errorMessage}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px] border-red-500/40 text-red-400 dark:text-red-300 hover:bg-red-500/20 hover:text-red-200 ml-2 shrink-0 cursor-pointer"
            onClick={onInitInvoice}
          >
            <RefreshCw className="size-3 mr-1" />
            <span>{isUk ? 'Повторити' : 'Retry'}</span>
          </Button>
        </div>
      )}

      {/* Order Summary */}
      <div className="rounded-xl border border-border/80 bg-muted/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              {t('plans.selectedPlanLabel')}
            </span>
            <Badge variant="default" className="text-xs font-bold font-mono">
              {planName} ({plan.code})
            </Badge>
          </div>
          {plan.isPopular && (
            <Badge
              variant="outline"
              className="border-primary/40 text-primary text-[10px] uppercase font-bold"
            >
              {t('plans.popular')}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t('plans.billingIntervalLabel')}</span>
          <span className="font-medium text-foreground">
            {isYearly ? t('plans.yearlyPeriod') : t('plans.monthlyPeriod')}
          </span>
        </div>

        {/* Quotas Breakdown */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Layers className="size-3.5 text-primary" />
            <span>{plan.maxXmlLimit.toLocaleString()} SKU</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="size-3.5 text-primary" />
            <span>{plan.aiCredits.toLocaleString()} AI credits</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-muted-foreground" />
            <span>{t('plans.durationFormat', { count: daysCount })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-foreground" />
            <span>SSL & WayForPay</span>
          </div>
        </div>

        {/* Total Price */}
        <div className="flex items-baseline justify-between pt-3 border-t border-border font-bold">
          <span className="text-xs text-foreground">{t('plans.totalDueLabel')}</span>
          <div className="text-right">
            <span
              className="text-2xl text-foreground font-extrabold tracking-tight"
              data-testid="checkout-total-amount"
            >
              {price.toLocaleString()} грн
            </span>
            {isYearly && (
              <div className="text-[10px] text-foreground font-medium">
                {t('plans.saveYearlyDiscount')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Reference */}
      {checkoutData && (
        <div className="flex items-center justify-between px-2 text-[11px] text-muted-foreground font-mono">
          <span>{checkoutData.orderReference}</span>
          <span className="text-foreground font-semibold">Sandbox test_merch_n1</span>
        </div>
      )}

      {/* WayForPay Button */}
      <div className="space-y-2 pt-1">
        <Button
          onClick={onOpenGateway}
          disabled={isLoadingInvoice}
          size="lg"
          className="w-full gap-2 font-bold shadow-md shadow-primary/10 h-11 text-sm cursor-pointer"
          data-testid="pay-wayforpay-btn"
        >
          {isLoadingInvoice ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>{isUk ? 'Формування рахунку...' : 'Creating invoice...'}</span>
            </>
          ) : (
            <>
              <Lock className="size-4" />
              <span>{t('plans.payWithWayForPay')}</span>
              <ExternalLink className="size-3.5 ml-auto opacity-70" />
            </>
          )}
        </Button>
      </div>

      {/* Sandbox Block */}
      <SandboxSimulationBlock
        isUk={isUk}
        t={t}
        isDisabled={isLoadingInvoice || !checkoutData}
        successTestId="simulate-payment-success-btn"
        declineTestId="simulate-payment-decline-btn"
        onSimulate={onSimulate}
      />

      <p className="text-[10px] text-muted-foreground text-center">
        {t('plans.securePaymentNotice')}
      </p>
    </div>
  );
}
