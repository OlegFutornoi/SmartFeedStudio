import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { TariffPlanDto, BillingInterval } from '@smartfeed/shared';
import { useCheckoutFlow } from '@/hooks/useCheckoutFlow';
import { CheckoutReviewStep } from '@/components/plans/CheckoutReviewStep';
import { CheckoutProcessingStep } from '@/components/plans/CheckoutProcessingStep';
import { CheckoutSuccessStep } from '@/components/plans/CheckoutSuccessStep';
import { CheckoutDeclinedStep } from '@/components/plans/CheckoutDeclinedStep';

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: TariffPlanDto | null;
  billingInterval: BillingInterval;
  onSuccess: () => void;
}

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  isOpen,
  onClose,
  plan,
  billingInterval,
  onSuccess,
}) => {
  const { t, language } = useTranslation(['plans', 'common']);
  const isUk = language === 'uk';

  const {
    step,
    setStep,
    checkoutData,
    isLoadingInvoice,
    errorMessage,
    planName,
    price,
    daysCount,
    isYearly,
    initInvoice,
    handleOpenWayForPayGateway,
    handleSimulatePayment,
    handleClose: hookClose,
  } = useCheckoutFlow({ isOpen, plan, billingInterval, isUk, onSuccess });

  const handleClose = () => {
    hookClose();
    onClose();
  };

  if (!isOpen || !plan) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-200"
      data-testid="payment-checkout-modal"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          data-testid="close-checkout-modal-btn"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label={t('plans.closeBtn')}
        >
          <X className="h-4 w-4" />
        </button>

        {step === 'REVIEW' && (
          <CheckoutReviewStep
            plan={plan}
            planName={planName}
            price={price}
            daysCount={daysCount}
            isYearly={isYearly}
            isLoadingInvoice={isLoadingInvoice}
            errorMessage={errorMessage}
            checkoutData={checkoutData}
            isUk={isUk}
            t={t}
            onInitInvoice={initInvoice}
            onOpenGateway={handleOpenWayForPayGateway}
            onSimulate={handleSimulatePayment}
          />
        )}

        {step === 'PROCESSING' && (
          <CheckoutProcessingStep
            checkoutData={checkoutData}
            price={price}
            isUk={isUk}
            t={t}
            onOpenGateway={handleOpenWayForPayGateway}
            onSimulate={handleSimulatePayment}
            onBackToReview={() => setStep('REVIEW')}
          />
        )}

        {step === 'SUCCESS' && (
          <CheckoutSuccessStep
            plan={plan}
            planName={planName}
            daysCount={daysCount}
            t={t}
            onClose={handleClose}
          />
        )}

        {step === 'DECLINED' && (
          <CheckoutDeclinedStep
            errorMessage={errorMessage}
            isUk={isUk}
            t={t}
            onClose={handleClose}
            onRetry={() => setStep('REVIEW')}
          />
        )}
      </div>
    </div>,
    document.body,
  );
};
