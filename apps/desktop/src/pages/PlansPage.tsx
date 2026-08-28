'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Building2,
  ShieldCheck,
  LayoutGrid,
  TableProperties,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation, getErrorMessage } from '@/i18n';
import { getMyLicense, getTariffPlans, selectTariffPlan } from '@/lib/api';
import { PlanCard } from '@/components/plans/PlanCard';
import { PlanComparisonTable } from '@/components/plans/PlanComparisonTable';
import { PaymentCheckoutModal } from '@/components/plans/PaymentCheckoutModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { LicenseEntity, TariffPlanDto, BillingInterval } from '@smartfeed/shared';

export const PlansPage: React.FC = () => {
  const { token, user } = useAuth();
  const { refreshNavigation } = useNavigation();
  const { t, language } = useTranslation(['plans', 'common', 'errors']);
  const isUk = language === 'uk';

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

  const handleSelectPlan = async (
    planCode: string,
    interval: BillingInterval = billingInterval,
  ) => {
    if (!token) return;

    // For paid tiers (GROWTH, PRO, ENTERPRISE), open WayForPay Checkout Modal
    if (planCode !== 'STARTER') {
      const foundPlan = plans.find((p) => p.code === planCode) || null;
      if (foundPlan) {
        setSelectedPlanForCheckout(foundPlan);
        setCheckoutInterval(interval);
        setIsCheckoutOpen(true);
        return;
      }
    }

    // For free starter plan: immediate selection without checkout
    setIsSubmitting(planCode);
    setRawError(null);
    setSuccessMessage(null);

    try {
      const updatedLicense = await selectTariffPlan(token, planCode, interval);
      setCurrentLicense(updatedLicense);
      setSuccessMessage(t('plans.planSwitchedSuccess'));
      await refreshNavigation();
    } catch (err) {
      setRawError(err);
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleCheckoutSuccess = async () => {
    if (!token) return;
    try {
      const updatedLicense = await getMyLicense(token);
      setCurrentLicense(updatedLicense);
      setSuccessMessage(t('plans.planSwitchedSuccess'));
      await refreshNavigation();
    } catch (err) {
      console.error('Failed to reload license after payment', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300 pb-12" data-testid="plans-page">
      {/* Header with Title, Billing Switcher & View Switcher */}
      <div className="flex flex-col gap-6 border-b border-border/60 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <CreditCard className="h-7 w-7 sm:h-8 sm:w-8 text-primary shrink-0" />
              <span data-testid="plans-header-title">{t('plans.title')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t('plans.subtitle')}</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Segmented View Switcher */}
            <div
              data-testid="plans-view-switcher"
              className="flex items-center bg-secondary/50 p-1 rounded-lg border border-border/60 shadow-xs"
            >
              <Button
                type="button"
                variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                size="sm"
                data-testid="plans-view-cards-btn"
                onClick={() => setViewMode('cards')}
                className={`h-8 px-3 text-xs gap-1.5 transition-all ${
                  viewMode === 'cards'
                    ? 'bg-background shadow-xs font-semibold text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="size-3.5" />
                <span className="hidden md:inline">{t('plans.cardsView')}</span>
              </Button>
              <Button
                type="button"
                variant={viewMode === 'comparison' ? 'secondary' : 'ghost'}
                size="sm"
                data-testid="plans-view-comparison-btn"
                onClick={() => setViewMode('comparison')}
                className={`h-8 px-3 text-xs gap-1.5 transition-all ${
                  viewMode === 'comparison'
                    ? 'bg-background shadow-xs font-semibold text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <TableProperties className="size-3.5" />
                <span className="hidden md:inline">{t('plans.comparisonView')}</span>
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={isLoading}
              className="h-8 px-2.5 text-xs shadow-xs"
              data-testid="refresh-plans-btn"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Billing Cycle Switcher */}
        {!isInvitedMember && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">
                {t('plans.billingIntervalLabel')}
              </span>
              <div
                data-testid="billing-cycle-switcher"
                className="inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border/80"
              >
                <button
                  type="button"
                  data-testid="billing-cycle-monthly-btn"
                  onClick={() => setBillingInterval('monthly')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    billingInterval === 'monthly'
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('plans.billingMonthly')}
                </button>
                <button
                  type="button"
                  data-testid="billing-cycle-yearly-btn"
                  onClick={() => setBillingInterval('yearly')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    billingInterval === 'yearly'
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{t('plans.billingYearly')}</span>
                  <Badge
                    data-testid="save-20-badge"
                    className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30 text-[10px] px-1.5 py-0 font-bold"
                  >
                    {t('plans.save20Badge')}
                  </Badge>
                </button>
              </div>
            </div>

            {billingInterval === 'yearly' && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <Sparkles className="size-3.5 shrink-0" />
                <span>{t('plans.saveYearlyDiscount')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Corporate License Notice for Invited Team Members */}
      {isInvitedMember && (
        <div
          data-testid="invited-member-plan-card"
          className="flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 text-foreground animate-in fade-in"
        >
          <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{t('plans.corporateLicenseNotice')}</h3>
              <Badge variant="secondary" className="text-[10px] font-mono uppercase">
                {user?.organization?.name || 'Company'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{t('plans.managedByOwnerDesc')}</p>
          </div>
        </div>
      )}

      {/* Expired License Warning Alert Banner */}
      {currentLicense?.isExpired && (
        <div
          data-testid="expired-license-banner"
          className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-in fade-in"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{t('plans.expiredBadge')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || !isInvitedMember
                ? isUk
                  ? 'Термін дії вашого тарифного плану вичерпано. Будь ласка, оберіть тариф для відновлення доступу.'
                  : 'Your subscription has expired. Please select a plan to restore access.'
                : isUk
                  ? 'Термін дії тарифного плану компанії вичерпано. Зверніться до власника організації.'
                  : 'Organization subscription has expired. Please contact the owner.'}
            </p>
          </div>
        </div>
      )}

      {/* Success Notification Alert */}
      {successMessage && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 animate-in fade-in"
          data-testid="plans-success-alert"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {/* Error Notification Alert */}
      {errorMessage && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive animate-in fade-in"
          data-testid="plans-error-alert"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Current License Status Dashboard Banner */}
      {currentLicense && (
        <div
          className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-xs space-y-4"
          data-testid="current-license-card"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">
                  {t('plans.currentPlan')}
                </div>
                <div
                  className="text-base font-bold text-foreground"
                  data-testid="current-plan-name"
                >
                  {currentLicense.tariffPlan?.nameUk ||
                    currentLicense.tariffPlan?.nameEn ||
                    currentLicense.planType}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant={currentLicense.isExpired ? 'destructive' : 'default'}
                className="text-xs px-2.5 py-0.5"
                data-testid="current-plan-status-badge"
              >
                {currentLicense.isExpired
                  ? t('plans.expiredBadge')
                  : `${t('plans.active')} • ${t('plans.daysRemaining', { count: currentLicense.daysRemaining ?? 0 })}`}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
              <div className="text-xs text-muted-foreground">{t('plans.xmlQuota')}</div>
              <div className="text-lg font-bold text-foreground mt-0.5">
                {currentLicense?.maxXmlLimit?.toLocaleString()} SKU
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
              <div className="text-xs text-muted-foreground">{t('plans.aiCreditsQuota')}</div>
              <div className="text-lg font-bold text-foreground mt-0.5">
                {currentLicense?.aiCredits?.toLocaleString()}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
              <div className="text-xs text-muted-foreground">{t('plans.channelsLimit')}</div>
              <div className="text-lg font-bold text-foreground mt-0.5">
                {currentLicense?.maxChannelsLimit ?? 1}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
              <div className="text-xs text-muted-foreground">{t('plans.cloudBackup')}</div>
              <div className="text-lg font-bold text-emerald-500 mt-0.5">
                {currentLicense?.canCloudBackup ? 'S3 MinIO / AWS' : 'Ні'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Loader OR (Cards View / Comparison Table) */}
      {isLoading && plans.length === 0 ? (
        <div className="flex h-64 w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : viewMode === 'cards' ? (
        <div
          data-testid="plans-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2"
        >
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlanCode={currentLicense?.planType}
              billingInterval={billingInterval}
              isExpired={currentLicense?.isExpired}
              daysRemaining={currentLicense?.daysRemaining}
              isLoading={isSubmitting === plan.code}
              isInvitedMember={isInvitedMember}
              onSelect={handleSelectPlan}
            />
          ))}
        </div>
      ) : (
        <div className="pt-2">
          <PlanComparisonTable
            plans={plans}
            currentPlanCode={currentLicense?.planType}
            billingInterval={billingInterval}
            isExpired={currentLicense?.isExpired}
            isLoadingPlanCode={isSubmitting}
            isInvitedMember={isInvitedMember}
            onSelect={handleSelectPlan}
          />
        </div>
      )}

      {/* WayForPay Checkout & Sandbox Simulation Modal */}
      <PaymentCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        plan={selectedPlanForCheckout}
        billingInterval={checkoutInterval}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
};
