import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  ExternalLink,
  X,
  RefreshCw,
  Clock,
  Layers,
  Zap,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { createPaymentCheckout, simulateSandboxPayment } from '@/lib/api';
import type { TariffPlanDto, BillingInterval, CheckoutResponseDto } from '@smartfeed/shared';

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: TariffPlanDto | null;
  billingInterval: BillingInterval;
  onSuccess: () => void;
}

type CheckoutStep = 'REVIEW' | 'PROCESSING' | 'SUCCESS' | 'DECLINED';

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  isOpen,
  onClose,
  plan,
  billingInterval,
  onSuccess,
}) => {
  const { token, user } = useAuth();
  const { t, language } = useTranslation(['plans', 'common']);
  const isUk = language === 'uk';

  const [step, setStep] = useState<CheckoutStep>('REVIEW');
  const [checkoutData, setCheckoutData] = useState<CheckoutResponseDto | null>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isYearly = billingInterval === 'yearly';
  const planName = plan ? (isUk ? plan.nameUk : plan.nameEn) : '';
  const price = plan
    ? isYearly
      ? plan.priceYearly || plan.priceMonthly * 12
      : plan.priceMonthly
    : 0;
  const daysCount = isYearly ? 365 : 30;

  const initInvoice = () => {
    if (!plan) return;
    setStep('REVIEW');
    setErrorMessage(null);
    setIsLoadingInvoice(true);

    if (token) {
      createPaymentCheckout(token, plan.code, billingInterval)
        .then((data) => {
          setCheckoutData(data);
        })
        .catch((err) => {
          console.error('Failed to create payment invoice', err);
          setErrorMessage(
            err.message ||
              (isUk
                ? 'Не вдалося створити рахунок на оплату'
                : 'Failed to initialize payment invoice'),
          );
        })
        .finally(() => {
          setIsLoadingInvoice(false);
        });
    } else {
      setIsLoadingInvoice(false);
      setErrorMessage(
        isUk
          ? 'Потрібна авторизація для оформлення підписки'
          : 'Authentication required to proceed with checkout',
      );
    }
  };

  useEffect(() => {
    if (isOpen && plan) {
      initInvoice();
    }
  }, [isOpen, plan, billingInterval, token]);

  if (!isOpen || !plan) return null;

  // Submit via official WayForPay POST Gateway form
  const handleOpenWayForPayGateway = () => {
    if (!checkoutData) {
      initInvoice();
      return;
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://secure.wayforpay.com/pay';
    form.target = '_blank';
    form.acceptCharset = 'utf-8';

    const params: Record<string, any> = {
      merchantAccount: checkoutData.merchantAccount,
      merchantAuthType: 'SimpleSignature',
      merchantDomainName: checkoutData.merchantDomainName,
      orderReference: checkoutData.orderReference,
      orderDate: checkoutData.orderDate,
      amount: checkoutData.amount,
      currency: checkoutData.currency,
      orderTimeout: 49000,
      productName: checkoutData.productName,
      productPrice: checkoutData.productPrice,
      productCount: checkoutData.productCount,
      merchantSignature: checkoutData.merchantSignature,
      language: isUk ? 'UA' : 'EN',
      clientEmail: user?.email || 'client@smartfeed.studio',
      clientFirstName: user?.fullName ? user.fullName.split(' ')[0] : 'Client',
      clientLastName: user?.fullName ? user.fullName.split(' ')[1] || 'User' : 'User',
      serviceUrl: checkoutData.serviceUrl,
      returnUrl: checkoutData.returnUrl,
    };

    Object.entries(params).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        val.forEach((item) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = `${key}[]`;
          input.value = String(item);
          form.appendChild(input);
        });
      } else if (val !== undefined && val !== null) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(val);
        form.appendChild(input);
      }
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    setStep('PROCESSING');
  };

  // Simulate Sandbox Webhook for local testing
  const handleSimulatePayment = async (status: 'Approved' | 'Declined') => {
    if (!token || !checkoutData) return;
    try {
      setStep('PROCESSING');
      setErrorMessage(null);

      await simulateSandboxPayment(
        token,
        checkoutData.orderReference,
        status,
        status === 'Declined'
          ? isUk
            ? 'Відхилено банком-емітентом (Do Not Honor)'
            : 'Declined by issuer bank (Do Not Honor)'
          : undefined,
      );

      if (status === 'Approved') {
        setStep('SUCCESS');
        onSuccess();
      } else {
        setErrorMessage(
          isUk
            ? 'Транзакцію відхилено банком: Недостатньо коштів на картці. Доступ не активовано.'
            : 'Transaction declined by bank: Insufficient funds. Access was not activated.',
        );
        setStep('DECLINED');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment simulation failed');
      setStep('DECLINED');
    }
  };

  const handleClose = () => {
    setStep('REVIEW');
    setCheckoutData(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0"
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

        {/* 1. REVIEW STEP */}
        {step === 'REVIEW' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2
                  className="text-lg font-bold text-foreground"
                  data-testid="checkout-modal-title"
                >
                  {t('plans.checkoutModalTitle')}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('plans.checkoutModalSubtitle')}
                </p>
              </div>
            </div>

            {/* Error Banner with Retry */}
            {errorMessage && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between animate-in fade-in">
                <span>{errorMessage}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] border-destructive/40 text-destructive hover:bg-destructive/20 ml-2 shrink-0"
                  onClick={initInvoice}
                >
                  <RefreshCw className="size-3 mr-1" />
                  <span>{isUk ? 'Повторити' : 'Retry'}</span>
                </Button>
              </div>
            )}

            {/* Order Summary Box */}
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
                  <Zap className="size-3.5 text-amber-500" />
                  <span>{plan.aiCredits.toLocaleString()} AI credits</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-blue-500" />
                  <span>{t('plans.durationFormat', { count: daysCount })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-emerald-500" />
                  <span>SSL & WayForPay</span>
                </div>
              </div>

              {/* Total Price Row */}
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
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {t('plans.saveYearlyDiscount')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Reference details if loaded */}
            {checkoutData && (
              <div className="flex items-center justify-between px-2 text-[11px] text-muted-foreground font-mono">
                <span>{checkoutData.orderReference}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Sandbox test_merch_n1
                </span>
              </div>
            )}

            {/* Primary Action Button: Opens real WayForPay Hosted Payment Page */}
            <div className="space-y-2 pt-1">
              <Button
                onClick={handleOpenWayForPayGateway}
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
                    <Lock className="size-4 text-emerald-400" />
                    <span>{t('plans.payWithWayForPay')}</span>
                    <ExternalLink className="size-3.5 ml-auto opacity-70" />
                  </>
                )}
              </Button>
            </div>

            {/* Sandbox Quick Testing Block */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Sparkles className="size-3.5" />
                <span>{t('plans.sandboxTestingTitle')}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{t('plans.sandboxTestingDesc')}</p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="simulate-payment-success-btn"
                  onClick={() => handleSimulatePayment('Approved')}
                  disabled={isLoadingInvoice || !checkoutData}
                  className="h-8 text-[11px] border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-medium"
                >
                  <span>{t('plans.simulateSuccessBtn')}</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="simulate-payment-decline-btn"
                  onClick={() => handleSimulatePayment('Declined')}
                  disabled={isLoadingInvoice || !checkoutData}
                  className="h-8 text-[11px] border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 font-medium"
                >
                  <span>{t('plans.simulateDeclineBtn')}</span>
                </Button>
              </div>
            </div>

            {/* Security Notice */}
            <p className="text-[10px] text-muted-foreground text-center">
              {t('plans.securePaymentNotice')}
            </p>
          </div>
        )}

        {/* 2. PROCESSING STEP */}
        {step === 'PROCESSING' && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-5 animate-in fade-in duration-200">
            <div className="relative">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Loader2 className="size-8 animate-spin" />
              </div>
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h3
                className="text-base font-bold text-foreground"
                data-testid="payment-processing-title"
              >
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

            {/* Actions while processing: Reopen WayForPay or Simulate Webhook */}
            <div className="w-full space-y-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenWayForPayGateway}
                className="w-full text-xs font-semibold gap-1.5 h-9"
                data-testid="reopen-wayforpay-btn"
              >
                <ExternalLink className="size-3.5" />
                <span>{t('plans.reopenWayForPay')}</span>
              </Button>

              {/* Sandbox controls inside processing modal */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="processing-simulate-success-btn"
                  onClick={() => handleSimulatePayment('Approved')}
                  className="h-8 text-[11px] border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-medium"
                >
                  <span>{t('plans.simulateSuccessBtn')}</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="processing-simulate-decline-btn"
                  onClick={() => handleSimulatePayment('Declined')}
                  className="h-8 text-[11px] border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 font-medium"
                >
                  <span>{t('plans.simulateDeclineBtn')}</span>
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('REVIEW')}
                className="w-full text-xs text-muted-foreground hover:text-foreground h-8"
              >
                <span>{isUk ? 'Повернутися до замовлення' : 'Back to order'}</span>
              </Button>
            </div>
          </div>
        )}

        {/* 3. SUCCESS STEP */}
        {step === 'SUCCESS' && (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 ring-8 ring-emerald-500/5">
              <CheckCircle2 className="size-9" />
            </div>

            <div className="space-y-1.5">
              <h3
                className="text-xl font-extrabold text-foreground"
                data-testid="payment-success-title"
              >
                {t('plans.paymentSuccessTitle')}
              </h3>
              <p
                className="text-xs text-muted-foreground max-w-sm"
                data-testid="payment-success-desc"
              >
                {t('plans.paymentSuccessDesc', { name: planName, days: daysCount })}
              </p>
            </div>

            <div className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs flex items-center justify-between">
              <span className="text-muted-foreground">{t('plans.active')}</span>
              <Badge className="bg-emerald-600 text-white font-mono font-bold">
                {plan.code} — {t('plans.durationFormat', { count: daysCount })}
              </Badge>
            </div>

            <Button
              onClick={handleClose}
              size="lg"
              data-testid="start-working-after-payment-btn"
              className="w-full font-bold shadow-lg shadow-emerald-500/10 h-11 text-sm"
            >
              <Sparkles className="size-4 mr-2" />
              <span>{t('plans.startWorkingBtn')}</span>
            </Button>
          </div>
        )}

        {/* 4. DECLINED STEP */}
        {step === 'DECLINED' && (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="size-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive ring-8 ring-destructive/5">
              <XCircle className="size-9" />
            </div>

            <div className="space-y-1.5">
              <h3
                className="text-xl font-extrabold text-foreground text-destructive"
                data-testid="payment-declined-title"
              >
                {t('plans.paymentDeclinedTitle')}
              </h3>
              <p
                className="text-xs text-muted-foreground max-w-sm"
                data-testid="payment-declined-desc"
              >
                {errorMessage || t('plans.paymentDeclinedDesc')}
              </p>
            </div>

            <div className="w-full rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive text-center font-medium">
              {isUk
                ? '⚠️ Доступ до операцій з каталогами залишається заблокованим.'
                : '⚠️ Access to catalog operations remains locked.'}
            </div>

            <div className="grid grid-cols-2 gap-3 w-full pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full text-xs font-semibold h-10"
              >
                <span>{t('plans.closeBtn')}</span>
              </Button>
              <Button
                onClick={() => setStep('REVIEW')}
                data-testid="try-again-payment-btn"
                className="w-full text-xs font-bold gap-1.5 h-10"
              >
                <RefreshCw className="size-3.5" />
                <span>{t('plans.tryAgainBtn')}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
