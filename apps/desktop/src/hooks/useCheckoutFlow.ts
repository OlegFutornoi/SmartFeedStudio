import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createPaymentCheckout, simulateSandboxPayment } from '@/lib/api';
import type { TariffPlanDto, BillingInterval, CheckoutResponseDto } from '@smartfeed/shared';

export type CheckoutStep = 'REVIEW' | 'PROCESSING' | 'SUCCESS' | 'DECLINED';

interface UseCheckoutFlowOptions {
  isOpen: boolean;
  plan: TariffPlanDto | null;
  billingInterval: BillingInterval;
  isUk: boolean;
  onSuccess: () => void;
}

function localizeCheckoutError(err: unknown, isUk: boolean): string {
  let raw = '';
  if (typeof err === 'string') raw = err;
  else if (err instanceof Error) raw = err.message;
  else if (err && typeof err === 'object' && 'message' in err)
    raw = String((err as { message: unknown }).message);

  const lower = raw.toLowerCase();
  if (
    lower.includes('authentication token is missing or invalid') ||
    lower.includes('jwt expired') ||
    lower.includes('token expired') ||
    lower.includes('invalid token') ||
    lower.includes('unauthorized')
  ) {
    return isUk
      ? 'Сесія авторизації недійсна або застаріла. Будь ласка, увійдіть повторно.'
      : 'Authentication token is missing or expired. Please sign in again.';
  }
  if (lower.includes('failed to fetch') || lower.includes('network error')) {
    return isUk
      ? "Помилка з'єднання із сервером. Перевірте мережу."
      : 'Network connection error. Please check your network.';
  }
  if (lower.includes('not found') || lower.includes('tariff plan not found')) {
    return isUk ? 'Тарифний план не знайдено' : 'Tariff plan not found';
  }
  return (
    raw || (isUk ? 'Не вдалося створити рахунок на оплату' : 'Failed to initialize payment invoice')
  );
}

export function useCheckoutFlow({
  isOpen,
  plan,
  billingInterval,
  isUk,
  onSuccess,
}: UseCheckoutFlowOptions) {
  const { token, user } = useAuth();

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

  const initInvoice = useCallback(() => {
    if (!plan) return;
    setStep('REVIEW');
    setErrorMessage(null);
    setIsLoadingInvoice(true);

    if (token) {
      createPaymentCheckout(token, plan.code, billingInterval)
        .then((data) => {
          setCheckoutData(data);
        })
        .catch((err: unknown) => {
          console.error('Failed to create payment invoice', err);
          setErrorMessage(localizeCheckoutError(err, isUk));
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
  }, [plan, token, billingInterval, isUk]);

  useEffect(() => {
    if (isOpen && plan) {
      initInvoice();
    }
  }, [isOpen, plan, initInvoice]);

  const handleOpenWayForPayGateway = useCallback(() => {
    if (!checkoutData) {
      initInvoice();
      return;
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://secure.wayforpay.com/pay';
    form.target = '_blank';
    form.acceptCharset = 'utf-8';

    const params: Record<string, string | number | string[] | number[] | undefined | null> = {
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
  }, [checkoutData, initInvoice, isUk, user]);

  const handleSimulatePayment = useCallback(
    async (status: 'Approved' | 'Declined') => {
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
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Payment simulation failed';
        setErrorMessage(message);
        setStep('DECLINED');
      }
    },
    [token, checkoutData, isUk, onSuccess],
  );

  const handleClose = useCallback(() => {
    setStep('REVIEW');
    setCheckoutData(null);
  }, []);

  return {
    step,
    setStep,
    checkoutData,
    isLoadingInvoice,
    errorMessage,
    planName,
    price,
    daysCount,
    isYearly,
    user,
    initInvoice,
    handleOpenWayForPayGateway,
    handleSimulatePayment,
    handleClose,
  };
}
