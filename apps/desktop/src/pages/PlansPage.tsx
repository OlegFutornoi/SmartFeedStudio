'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Building2 } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { PlanCard } from '@/components/plans/PlanCard';
import { PlanComparisonTable } from '@/components/plans/PlanComparisonTable';
import { PaymentCheckoutModal } from '@/components/plans/PaymentCheckoutModal';
import { PlansPageHeader } from '@/components/plans/PlansPageHeader';
import { CurrentLicenseBanner } from '@/components/plans/CurrentLicenseBanner';
import { Badge } from '@/components/ui/badge';
import { usePlansPageData } from '@/hooks/usePlansPageData';

export const PlansPage: React.FC = () => {
  const { t, language } = useTranslation(['plans', 'common', 'errors']);
  const isUk = language === 'uk';

  const {
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
  } = usePlansPageData();

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300 pb-12" data-testid="plans-page">
      {/* Header with Title, Billing Switcher & View Switcher */}
      <PlansPageHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        billingInterval={billingInterval}
        setBillingInterval={setBillingInterval}
        isLoading={isLoading}
        isInvitedMember={isInvitedMember}
        onRefresh={() => loadData(true)}
      />

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
          className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/70 text-foreground animate-in fade-in"
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
          className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/70 text-foreground animate-in fade-in"
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
      {currentLicense && <CurrentLicenseBanner currentLicense={currentLicense} />}

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
