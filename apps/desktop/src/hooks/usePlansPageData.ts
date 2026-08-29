import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLicense } from '@/contexts/LicenseContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation, getErrorMessage } from '@/i18n';
import { getMyLicense, getTariffPlans, selectTariffPlan } from '@/lib/api';
import type { LicenseEntity, TariffPlanDto, BillingInterval } from '@smartfeed/shared';

export function usePlansPageData() {
  const { token, user } = useAuth();
  const { refreshLicense } = useLicense();
  const { refreshNavigation } = useNavigation();
  const { t } = useTranslation(['plans', 'common', 'errors']);

  const [plans, setPlans] = useState<TariffPlanDto[]>([]);
  const [currentLicense, setCurrentLicense] = useState<LicenseEntity | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'comparison'>('cards');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rawError, setRawError] = useState<unknown>(null);

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<TariffPlanDto | null>(
    null,
  );
  const [checkoutInterval, setCheckoutInterval] = useState<BillingInterval>('monthly');

  // In-flight request deduplication refs (Zero-Duplicate Requests)
  const isFetchingRef = useRef<boolean>(false);
  const lastFetchedTokenRef = useRef<string | null>(null);

  const errorMessage = useMemo(
    () => (rawError ? getErrorMessage(rawError, t) : null),
    [rawError, t],
  );

  const isInvitedMember = Boolean(user?.organization && user.organization.role !== 'OWNER');

  const loadData = useCallback(
    async (force = false) => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      if (!force && lastFetchedTokenRef.current === token && plans.length > 0) {
        return;
      }
      if (isFetchingRef.current) {
        return;
      }

      try {
        isFetchingRef.current = true;
        setIsLoading(true);
        setRawError(null);

        const [plansData, licenseData] = await Promise.all([
          getTariffPlans(),
          getMyLicense(token).catch(() => null),
        ]);
        lastFetchedTokenRef.current = token;
        setPlans(plansData || []);
        setCurrentLicense(licenseData);
      } catch (err) {
        setRawError(err);
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
      }
    },
    [token, plans.length],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectPlan = useCallback(
    async (planCode: string, interval: BillingInterval = billingInterval) => {
      if (!token) return;

      // Open WayForPay Checkout Modal for any plan with price > 0
      const foundPlan = plans.find((p) => p.code === planCode) || null;
      if (
        foundPlan &&
        ((interval === 'yearly' && (foundPlan.priceYearly || 0) > 0) || foundPlan.priceMonthly > 0)
      ) {
        setSelectedPlanForCheckout(foundPlan);
        setCheckoutInterval(interval);
        setIsCheckoutOpen(true);
        return;
      }

      setIsSubmitting(planCode);
      setRawError(null);
      setSuccessMessage(null);

      try {
        const updatedLicense = await selectTariffPlan(token, planCode, interval);
        setCurrentLicense(updatedLicense);
        setSuccessMessage(t('plans.planSwitchedSuccess'));
        await refreshLicense();
        await refreshNavigation();
      } catch (err) {
        setRawError(err);
      } finally {
        setIsSubmitting(null);
      }
    },
    [token, plans, billingInterval, refreshLicense, refreshNavigation, t],
  );

  const handleCheckoutSuccess = useCallback(async () => {
    if (!token) return;
    try {
      const updatedLicense = await getMyLicense(token);
      setCurrentLicense(updatedLicense);
      setSuccessMessage(t('plans.planSwitchedSuccess'));
      await refreshLicense();
      await refreshNavigation();
    } catch (err) {
      console.error('Failed to reload license after payment', err);
    }
  }, [token, refreshLicense, refreshNavigation, t]);

  return {
    plans,
    currentLicense,
    viewMode,
    setViewMode,
    billingInterval,
    setBillingInterval,
    isLoading,
    isSubmitting,
    successMessage,
    errorMessage,
    isCheckoutOpen,
    setIsCheckoutOpen,
    selectedPlanForCheckout,
    checkoutInterval,
    isInvitedMember,
    user,
    loadData,
    handleSelectPlan,
    handleCheckoutSuccess,
  };
}
